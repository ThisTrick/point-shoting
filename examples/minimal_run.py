#!/usr/bin/env python3
"""Minimal example script for point shooting animation"""

import sys
from pathlib import Path

# Add src to path for development
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

import time

from point_shoting.cli.control_interface import ControlInterface
from point_shoting.models.settings import (
    ColorMode,
    DensityProfile,
    Settings,
    SpeedProfile,
)
from point_shoting.services.particle_engine import ParticleEngine


def create_test_image():
    """Create a simple test image if PIL is available"""
    try:
        from PIL import Image, ImageDraw

        # Create a simple test image
        img = Image.new("RGB", (200, 200), "white")
        draw = ImageDraw.Draw(img)

        # Draw a simple smiley face
        # Face circle
        draw.ellipse([50, 50, 150, 150], outline="black", width=3)

        # Eyes
        draw.ellipse([70, 80, 85, 95], fill="black")
        draw.ellipse([115, 80, 130, 95], fill="black")

        # Smile
        draw.arc([75, 100, 125, 130], 0, 180, fill="black", width=3)

        # Save test image
        test_image_path = Path(__file__).parent / "test_image.png"
        img.save(test_image_path)
        return test_image_path

    except ImportError:
        print("PIL not available, cannot create test image.")
        return None


def minimal_run():
    """Minimal animation run example"""
    print("Point Shooting - Minimal Example")
    print("=" * 40)

    # Create or use test image
    test_image = create_test_image()
    if not test_image:
        print("Please provide a test image or install PIL/Pillow")
        return

    print(f"Using test image: {test_image}")

    # Create settings
    settings = Settings(
        density_profile=DensityProfile.MEDIUM,  # ~9k particles
        speed_profile=SpeedProfile.NORMAL,  # Normal animation speed
        color_mode=ColorMode.STYLIZED,  # Stylized colors
        hud_enabled=True,  # Show HUD
    )

    print(f"Particle count: {settings.get_particle_count()}")
    print(f"Speed multiplier: {settings.get_speed_multiplier()}")

    # Initialize engine and control
    engine = ParticleEngine()
    control = ControlInterface(engine)

    # Start animation
    print("Starting animation...")
    success = control.start(settings, str(test_image))

    if not success:
        print("Failed to start animation")
        return

    # Run animation loop
    start_time = time.time()
    frame_count = 0
    target_fps = 60
    frame_time = 1.0 / target_fps

    try:
        while True:
            loop_start = time.perf_counter()

            # Step simulation
            if control.is_running():
                engine.step()
                frame_count += 1

                # Get metrics every 60 frames (1 second)
                if frame_count % 60 == 0:
                    metrics = control.get_metrics()
                    if metrics:
                        print(
                            f"Frame {frame_count}: "
                            f"Stage={metrics.stage.name}, "
                            f"Progress={metrics.get_stage_progress_estimate():.1%}, "
                            f"FPS={metrics.fps_avg:.1f}"
                        )

            # Check if we've been running long enough
            runtime = time.time() - start_time
            current_stage = control.get_current_stage()

            # Auto-skip to final after 10 seconds
            if (
                runtime > 10
                and current_stage
                and current_stage.name != "FINAL_BREATHING"
            ):
                print("Auto-skipping to final breathing stage...")
                control.skip_to_final()

            # Exit after 20 seconds total
            if runtime > 20:
                print("Exiting after 20 seconds")
                break

            # Frame rate limiting
            elapsed = time.perf_counter() - loop_start
            sleep_time = frame_time - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

    except KeyboardInterrupt:
        print("\nInterrupted by user")
    finally:
        control.stop()
        print(f"Animation completed. Total frames: {frame_count}")

        # Show final stats
        stats = control.get_control_stats()
        print("Final control stats:")
        for key, value in stats.items():
            if isinstance(value, dict):
                print(f"  {key}:")
                for k, v in value.items():
                    print(f"    {k}: {v}")
            else:
                print(f"  {key}: {value}")


def interactive_demo():
    """Interactive demo with user controls"""
    print("Interactive Demo - Press keys for controls:")
    print("  'p' = pause/resume")
    print("  'r' = restart")
    print("  's' = skip to final")
    print("  'q' = quit")
    print("  Enter = step when paused")

    # TODO: Implement interactive controls
    # This would require keyboard input handling
    print("Interactive demo not yet implemented.")
    print("Use minimal_run() for basic functionality.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--interactive":
        interactive_demo()
    else:
        minimal_run()
