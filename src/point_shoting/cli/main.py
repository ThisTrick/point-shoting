#!/usr/bin/env python3
"""Main CLI entrypoint for point shooting animation system"""

import argparse
import sys
import time
from pathlib import Path
from typing import Optional

from ..models.settings import Settings, Density, Speed, ColorMode
from ..services.particle_engine import ParticleEngine
from ..services.hud_renderer import HUDRenderer, HUDLevel
from ..services.localization_provider import LocalizationProvider
from .control_interface import ControlInterface


def create_parser() -> argparse.ArgumentParser:
    """Create command line argument parser"""
    parser = argparse.ArgumentParser(
        description="Point Shooting - Particle Burst Animation System",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Required arguments
    parser.add_argument(
        "image",
        type=str,
        help="Path to target image (PNG/JPEG)"
    )
    
    # Animation settings
    parser.add_argument(
        "--density",
        type=str,
        choices=["low", "medium", "high"],
        default="medium",
        help="Particle density level"
    )
    
    parser.add_argument(
        "--speed", 
        type=str,
        choices=["slow", "normal", "fast"],
        default="normal",
        help="Animation speed"
    )
    
    parser.add_argument(
        "--color-mode",
        type=str,
        choices=["stylized", "precise"],
        default="stylized",
        help="Color mapping strategy"
    )
    
    # Display options
    parser.add_argument(
        "--hud",
        action="store_true",
        help="Enable HUD overlay"
    )
    
    parser.add_argument(
        "--hud-level",
        type=str,
        choices=["minimal", "standard", "detailed"],
        default="standard",
        help="HUD detail level"
    )
    
    # Localization
    parser.add_argument(
        "--locale",
        type=str,
        default="en",
        help="UI locale (en, uk, etc.)"
    )
    
    # Behavior
    parser.add_argument(
        "--loop",
        action="store_true", 
        help="Loop animation continuously"
    )
    
    parser.add_argument(
        "--auto-skip",
        type=float,
        metavar="SECONDS",
        help="Auto-skip to final breathing after N seconds"
    )
    
    parser.add_argument(
        "--exit-after",
        type=float,
        metavar="SECONDS",
        help="Exit after N seconds of final breathing"
    )
    
    # Technical options
    parser.add_argument(
        "--max-fps",
        type=int,
        default=60,
        help="Maximum target FPS"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose output"
    )
    
    return parser


def parse_density(density_str: str) -> Density:
    """Parse density string to enum"""
    density_map = {
        "low": Density.LOW,
        "medium": Density.MEDIUM,
        "high": Density.HIGH
    }
    return density_map[density_str]


def parse_speed(speed_str: str) -> Speed:
    """Parse speed string to enum"""
    speed_map = {
        "slow": Speed.SLOW,
        "normal": Speed.NORMAL, 
        "fast": Speed.FAST
    }
    return speed_map[speed_str]


def parse_color_mode(color_mode_str: str) -> ColorMode:
    """Parse color mode string to enum"""
    color_mode_map = {
        "stylized": ColorMode.STYLIZED,
        "precise": ColorMode.PRECISE
    }
    return color_mode_map[color_mode_str]


def parse_hud_level(hud_level_str: str) -> HUDLevel:
    """Parse HUD level string to enum"""
    hud_level_map = {
        "minimal": HUDLevel.MINIMAL,
        "standard": HUDLevel.STANDARD,
        "detailed": HUDLevel.DETAILED
    }
    return hud_level_map[hud_level_str]


def setup_localization(locale: str) -> LocalizationProvider:
    """Setup localization provider"""
    localization = LocalizationProvider()
    localization.set_locale(locale)
    return localization


def validate_image_path(image_path: str) -> Path:
    """Validate and return image path"""
    path = Path(image_path)
    
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")
    
    if not path.is_file():
        raise ValueError(f"Path is not a file: {image_path}")
    
    # Check file extension
    valid_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.tif'}
    if path.suffix.lower() not in valid_extensions:
        raise ValueError(f"Unsupported image format: {path.suffix}")
    
    return path


def create_settings(args) -> Settings:
    """Create Settings object from command line arguments"""
    return Settings(
        density=parse_density(args.density),
        speed=parse_speed(args.speed),
        color_mode=parse_color_mode(args.color_mode),
        hud_enabled=args.hud
    )


def run_animation(args, settings: Settings, image_path: Path) -> None:
    """Run the main animation loop"""
    # Initialize components
    engine = ParticleEngine()
    hud_renderer = HUDRenderer() if args.hud else None
    control = ControlInterface(engine)
    localization = setup_localization(args.locale)
    
    # Configure HUD if enabled
    if hud_renderer:
        hud_level = parse_hud_level(args.hud_level)
        hud_renderer.configure(level=hud_level)
    
    # Start animation
    try:
        success = control.start(settings, str(image_path))
        if not success:
            print(f"Failed to start animation with image: {image_path}")
            return
        
        if args.verbose:
            print(f"Started animation with {settings.get_particle_count()} particles")
            print(f"Settings: {settings}")
        
        # Main loop
        start_time = time.time()
        frame_count = 0
        target_frame_time = 1.0 / args.max_fps
        
        # Auto-skip tracking
        auto_skip_triggered = False
        
        while True:
            frame_start = time.perf_counter()
            
            # Check for auto-skip
            if (args.auto_skip and not auto_skip_triggered and 
                time.time() - start_time >= args.auto_skip):
                control.skip_to_final()
                auto_skip_triggered = True
                if args.verbose:
                    print(f"Auto-skipping to final stage after {args.auto_skip}s")
            
            # Step engine
            if control.is_running():
                engine.step()
                frame_count += 1
            
            # Update HUD
            if hud_renderer and hud_renderer.is_enabled():
                metrics = control.get_metrics()
                if metrics:
                    additional_info = {
                        "Frame": frame_count,
                        "Runtime": f"{time.time() - start_time:.1f}s"
                    }
                    hud_renderer.render_hud(metrics, additional_info)
            
            # Check exit conditions
            current_time = time.time()
            runtime = current_time - start_time
            
            # Exit after specified time in final breathing
            if args.exit_after:
                current_stage = control.get_current_stage()
                if (current_stage and current_stage.name == "FINAL_BREATHING" and
                    runtime >= args.exit_after):
                    if args.verbose:
                        print(f"Exiting after {args.exit_after}s in final breathing")
                    break
            
            # Loop mode check
            if not args.loop:
                current_stage = control.get_current_stage()
                if (current_stage and current_stage.name == "FINAL_BREATHING" and
                    runtime >= 15):  # Default exit after 15s in final breathing
                    if args.verbose:
                        print("Animation complete")
                    break
            
            # Frame rate limiting
            frame_time = time.perf_counter() - frame_start
            sleep_time = target_frame_time - frame_time
            if sleep_time > 0:
                time.sleep(sleep_time)
            
            # Performance warning
            if args.verbose and frame_time > target_frame_time * 1.5:
                fps = 1.0 / frame_time
                print(f"Performance warning: {fps:.1f} FPS (target: {args.max_fps})")
                
    except KeyboardInterrupt:
        if args.verbose:
            print("\nInterrupted by user")
    except Exception as e:
        print(f"Animation error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
    finally:
        # Cleanup
        control.stop()
        if hud_renderer:
            hud_renderer.clear()
        
        if args.verbose:
            stats = control.get_control_stats()
            print(f"Final stats: {stats}")


def main() -> int:
    """Main entry point"""
    parser = create_parser()
    args = parser.parse_args()
    
    try:
        # Validate image path
        image_path = validate_image_path(args.image)
        
        # Create settings
        settings = create_settings(args)
        
        # Run animation
        run_animation(args, settings, image_path)
        
        return 0
        
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return 1
    except ValueError as e:
        print(f"Error: {e}")
        return 1
    except Exception as e:
        print(f"Unexpected error: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())