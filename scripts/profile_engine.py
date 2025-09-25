#!/usr/bin/env python3
"""
Profiling script for particle engine performance analysis.

Prints stage timings and performance metrics to help identify bottlenecks.
"""

import argparse
import cProfile
import pstats
import time
from pathlib import Path
import tempfile
from PIL import Image

from point_shoting.services.particle_engine import ParticleEngine
from point_shoting.models.settings import Settings, DensityProfile, SpeedProfile, ColorMode
from point_shoting.models.stage import Stage


def create_test_image(size=(128, 128), color='red'):
    """Create a test image for profiling."""
    temp_dir = Path(tempfile.gettempdir())
    image_path = temp_dir / f"profile_test_{size[0]}x{size[1]}.png"
    
    image = Image.new('RGB', size, color=color)
    image.save(image_path)
    return str(image_path)


def profile_engine_performance(particle_count=8000, steps=100, image_size=(128, 128)):
    """Profile the particle engine for the specified configuration."""
    print(f"Profiling engine with {particle_count} particles, {steps} steps")
    print(f"Image size: {image_size[0]}x{image_size[1]}")
    
    # Create test setup
    image_path = create_test_image(image_size)
    
    # Map particle count to density profile (approximate)
    if particle_count <= 4000:
        density_profile = DensityProfile.LOW
    elif particle_count <= 10000:
        density_profile = DensityProfile.MEDIUM
    else:
        density_profile = DensityProfile.HIGH
    
    settings = Settings(
        density_profile=density_profile,
        speed_profile=SpeedProfile.NORMAL,
        color_mode=ColorMode.STYLIZED,
        hud_enabled=True,
        locale='en',
        loop_mode=False
    )
    
    engine = ParticleEngine()
    
    # Profile initialization
    init_start = time.time()
    engine.init(settings, image_path)
    engine.start()  # Start the simulation
    init_time = time.time() - init_start
    
    print(f"\nInitialization time: {init_time:.3f}s")
    
    # Profile step execution
    def run_steps():
        for i in range(steps):
            engine.step()  # Run simulation step
            
            # Print stage progression
            if i % 20 == 0:
                metrics = engine.get_metrics()
                print(f"Step {i:3d}: Stage={metrics.stage.name:12s} "
                      f"Recognition={metrics.recognition:.3f} "
                      f"FPS={metrics.fps_instant:.1f}")
    
    # Run with profiling
    print(f"\nRunning {steps} simulation steps...")
    
    profiler = cProfile.Profile()
    start_time = time.time()
    
    profiler.enable()
    run_steps()
    profiler.disable()
    
    total_time = time.time() - start_time
    avg_fps = steps / total_time
    
    print(f"\nPerformance Summary:")
    print(f"Total time: {total_time:.3f}s")
    print(f"Average FPS: {avg_fps:.1f}")
    print(f"Time per step: {(total_time / steps) * 1000:.2f}ms")
    
    # Show profiling results
    print(f"\nTop function calls by cumulative time:")
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(20)  # Top 20 functions
    
    # Stage timing breakdown
    final_metrics = engine.get_metrics()
    print(f"\nFinal state:")
    print(f"Stage: {final_metrics.stage.name}")
    print(f"Recognition: {final_metrics.recognition:.3f}")
    print(f"Particle count: {final_metrics.particle_count}")
    
    # Cleanup
    Path(image_path).unlink(missing_ok=True)
    
    return {
        'avg_fps': avg_fps,
        'total_time': total_time,
        'init_time': init_time,
        'final_stage': final_metrics.stage,
        'final_recognition': final_metrics.recognition
    }


def profile_stage_specific(stage_name, particle_count=5000, steps=50):
    """Profile specific stage performance."""
    print(f"\nProfiling {stage_name} stage specifically...")
    
    image_path = create_test_image((64, 64))
    settings = Settings(
        density_profile=DensityProfile.MEDIUM,
        speed_profile=SpeedProfile.NORMAL,
        color_mode=ColorMode.STYLIZED,
        hud_enabled=False,
        locale='en',
        loop_mode=False
    )
    
    engine = ParticleEngine()
    engine.init(settings, image_path)
    engine.start()
    
    # Fast-forward to desired stage
    target_stage = getattr(Stage, stage_name.upper())
    
    # Step until we reach target stage
    max_attempts = 500
    attempt = 0
    while engine.stage() != target_stage and attempt < max_attempts:
        engine.step()
        attempt += 1
    
    if engine.stage() != target_stage:
        print(f"Warning: Could not reach {stage_name} stage (got {engine.stage().name})")
        Path(image_path).unlink(missing_ok=True)
        return None
    
    print(f"Reached {stage_name} stage, profiling {steps} steps...")
    
    # Profile the target stage
    profiler = cProfile.Profile()
    start_time = time.time()
    
    profiler.enable()
    for _ in range(steps):
        engine.step()
    profiler.disable()
    
    stage_time = time.time() - start_time
    stage_fps = steps / stage_time
    
    print(f"{stage_name} stage performance:")
    print(f"Time: {stage_time:.3f}s")
    print(f"FPS: {stage_fps:.1f}")
    print(f"Time per step: {(stage_time / steps) * 1000:.2f}ms")
    
    # Show top functions for this stage
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats(10)
    
    Path(image_path).unlink(missing_ok=True)
    
    return {
        'stage': stage_name,
        'fps': stage_fps,
        'time_per_step': stage_time / steps
    }


def main():
    """Main profiling script entry point."""
    parser = argparse.ArgumentParser(description='Profile particle engine performance')
    parser.add_argument('--particles', type=int, default=8000, 
                        help='Number of particles (default: 8000)')
    parser.add_argument('--steps', type=int, default=100,
                        help='Number of simulation steps (default: 100)')
    parser.add_argument('--image-size', type=int, nargs=2, default=[128, 128],
                        help='Image size WxH (default: 128 128)')
    parser.add_argument('--stage', type=str, choices=['chaos', 'converging', 'formation'],
                        help='Profile specific stage')
    parser.add_argument('--compare-densities', action='store_true',
                        help='Compare performance across different particle densities')
    
    args = parser.parse_args()
    
    if args.compare_densities:
        print("Comparing performance across particle densities...")
        densities = [3000, 6000, 9000, 12000, 15000]
        results = []
        
        for density in densities:
            print(f"\n{'='*50}")
            result = profile_engine_performance(
                particle_count=density,
                steps=50,  # Fewer steps for comparison
                image_size=(64, 64)  # Smaller image for speed
            )
            result['density'] = density
            results.append(result)
        
        print(f"\n{'='*50}")
        print("Density Comparison Summary:")
        print(f"{'Particles':<10} {'FPS':<8} {'Init(s)':<8} {'Stage':<12} {'Recognition'}")
        print("-" * 50)
        for r in results:
            print(f"{r['density']:<10} {r['avg_fps']:<8.1f} {r['init_time']:<8.3f} "
                  f"{r['final_stage'].name:<12} {r['final_recognition']:<8.3f}")
    
    elif args.stage:
        profile_stage_specific(args.stage, args.particles, args.steps)
    
    else:
        profile_engine_performance(
            particle_count=args.particles,
            steps=args.steps,
            image_size=tuple(args.image_size)
        )


if __name__ == '__main__':
    main()
