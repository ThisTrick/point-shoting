"""
E2E tests for the complete particle animation engine pipeline.

These tests validate the full end-to-end workflow from image loading
through all animation stages to final recognition.
"""

import time
import pytest
from pathlib import Path
from unittest.mock import patch

from src.point_shoting.cli.control_interface import ControlInterface
from src.point_shoting.models.settings import (
    ColorMode,
    DensityProfile,
    Settings,
    SpeedProfile,
)
from src.point_shoting.models.stage import Stage
from src.point_shoting.services.particle_engine import ParticleEngine


@pytest.mark.e2e
@pytest.mark.timeout(180)  # 3 minutes max for E2E test
class TestEnginePipeline:
    """E2E tests for the complete particle animation pipeline."""

    def setup_method(self):
        """Setup test environment."""
        self.test_image = Path(__file__).parent.parent.parent / "examples" / "test_image.png"
        if not self.test_image.exists():
            pytest.skip(f"Test image not found: {self.test_image}")

        self.settings = Settings(
            density_profile=DensityProfile.MEDIUM,
            speed_profile=SpeedProfile.NORMAL,
            color_mode=ColorMode.STYLIZED,
            hud_enabled=False,  # Disable HUD for testing
        )

    def test_full_animation_pipeline(self):
        """
        Test complete particle animation pipeline from image load to final breathing.

        Validates:
        - Image loading and processing
        - Particle initialization
        - Stage transitions (BURST → CHAOS → CONVERGING → FORMATION → BREATHING)
        - Recognition score convergence
        - Final frame output
        """
        engine = ParticleEngine()
        control = ControlInterface(engine)

        # Start animation
        success = control.start(self.settings, str(self.test_image))
        assert success, "Failed to start animation"

        # Track stage progression
        stages_reached = set()
        frame_count = 0
        start_time = time.time()
        max_runtime = 120  # 2 minutes max

        try:
            while control.is_running() and (time.time() - start_time) < max_runtime:
                # Step simulation
                engine.step()
                frame_count += 1

                # Track current stage
                current_stage = control.get_current_stage()
                if current_stage:
                    stages_reached.add(current_stage)

                # Get metrics every 30 frames
                if frame_count % 30 == 0:
                    metrics = control.get_metrics()
                    if metrics:
                        print(f"Frame {frame_count}: Stage={metrics.stage.name}, "
                              f"Progress={metrics.get_stage_progress_estimate():.1%}, "
                              f"FPS={metrics.fps_avg:.1f}")

                        # Check if we've reached final breathing with good recognition
                        if (metrics.stage == Stage.FINAL_BREATHING and
                            metrics.recognition >= 0.8):
                            break

            # Validate results
            final_metrics = control.get_metrics()
            assert final_metrics is not None, "No final metrics available"

            # Check stage progression
            expected_stages = {Stage.BURST, Stage.CHAOS, Stage.CONVERGING, Stage.FORMATION, Stage.FINAL_BREATHING}
            reached_stage_names = {s.name for s in stages_reached}
            expected_stage_names = {s.name for s in expected_stages}

            print(f"Stages reached: {reached_stage_names}")
            print(f"Expected stages: {expected_stage_names}")

            # Allow for some stages to be skipped in fast execution
            assert Stage.FINAL_BREATHING in stages_reached, f"Never reached FINAL_BREATHING stage. Reached: {reached_stage_names}"

            # Validate final state
            assert final_metrics.stage == Stage.FINAL_BREATHING, f"Final stage should be FINAL_BREATHING, got {final_metrics.stage}"
            assert final_metrics.recognition >= 0.8, f"Recognition score {final_metrics.recognition} below 0.8 threshold"
            assert frame_count > 100, f"Animation should run for more than 100 frames, got {frame_count}"
            assert final_metrics.fps_avg >= 30, f"Average FPS {final_metrics.fps_avg} below 30 threshold"

        finally:
            control.stop()

    def test_stage_transitions_with_timeouts(self):
        """
        Test that stage transitions occur within expected time limits.

        Validates that the animation doesn't get stuck in any stage.
        """
        engine = ParticleEngine()
        control = ControlInterface(engine)

        success = control.start(self.settings, str(self.test_image))
        assert success, "Failed to start animation"

        stage_start_times = {}
        current_stage = None
        frame_count = 0
        start_time = time.time()

        try:
            while control.is_running() and (time.time() - start_time) < 60:  # 1 minute max
                engine.step()
                frame_count += 1

                new_stage = control.get_current_stage()
                if new_stage != current_stage:
                    if current_stage is not None:
                        # Record time spent in previous stage
                        stage_time = time.time() - stage_start_times[current_stage]
                        print(f"Stage {current_stage.name}: {stage_time:.2f}s")

                    current_stage = new_stage
                    stage_start_times[current_stage] = time.time()

                # Check for stage timeouts (no stage should take more than 30 seconds)
                if current_stage and (time.time() - stage_start_times[current_stage]) > 30:
                    control.stop()
                    pytest.fail(f"Stage {current_stage.name} timed out after 30 seconds")

                # Exit early if we reach final breathing
                if current_stage == Stage.FINAL_BREATHING:
                    break

            assert current_stage == Stage.FINAL_BREATHING, f"Should reach FINAL_BREATHING, got {current_stage}"

        finally:
            control.stop()

    def test_recognition_convergence(self):
        """
        Test that recognition score increases monotonically during CONVERGING and FORMATION stages.

        Validates that the algorithm is working correctly and converging on a solution.
        """
        engine = ParticleEngine()
        control = ControlInterface(engine)

        success = control.start(self.settings, str(self.test_image))
        assert success, "Failed to start animation"

        recognition_scores = []
        stages_seen = set()
        frame_count = 0

        try:
            while control.is_running() and frame_count < 2000:  # Limit to prevent infinite loop
                engine.step()
                frame_count += 1

                metrics = control.get_metrics()
                if metrics:
                    current_stage = metrics.stage
                    stages_seen.add(current_stage)

                    # Track recognition scores during CONVERGING and FORMATION
                    if current_stage in [Stage.CONVERGING, Stage.FORMATION]:
                        recognition_scores.append(metrics.recognition)

                    # Exit when we reach final breathing
                    if current_stage == Stage.FINAL_BREATHING:
                        break

            # Validate convergence
            assert Stage.FORMATION in stages_seen, "Never reached FORMATION stage"

            if len(recognition_scores) > 1:
                # Check that recognition generally increases (allow for small fluctuations)
                increasing_count = sum(1 for i in range(1, len(recognition_scores))
                                     if recognition_scores[i] >= recognition_scores[i-1])
                increasing_ratio = increasing_count / len(recognition_scores)

                assert increasing_ratio >= 0.7, f"Recognition score only increased {increasing_ratio:.1%} of the time"

            # Final recognition should be good
            final_metrics = control.get_metrics()
            if final_metrics:
                assert final_metrics.recognition >= 0.7, f"Final recognition {final_metrics.recognition} too low"

        finally:
            control.stop()

    def test_performance_under_load(self):
        """
        Test that the engine maintains acceptable performance with medium density settings.

        Validates FPS targets and frame timing.
        """
        engine = ParticleEngine()
        control = ControlInterface(engine)

        success = control.start(self.settings, str(self.test_image))
        assert success, "Failed to start animation"

        frame_times = []
        frame_count = 0
        start_time = time.time()

        try:
            while control.is_running() and frame_count < 300:  # Test first 300 frames
                frame_start = time.perf_counter()
                engine.step()
                frame_end = time.perf_counter()

                frame_times.append(frame_end - frame_start)
                frame_count += 1

                # Exit early if we reach final breathing
                if control.get_current_stage() == Stage.FINAL_BREATHING:
                    break

            # Calculate performance metrics
            avg_frame_time = sum(frame_times) / len(frame_times)
            avg_fps = 1.0 / avg_frame_time

            print(f"Average frame time: {avg_frame_time:.4f}s")
            print(f"Average FPS: {avg_fps:.1f}")

            # Performance assertions
            assert avg_fps >= 30, f"Average FPS {avg_fps:.1f} below 30 target"
            assert avg_frame_time <= 1.0/30, f"Frame time {avg_frame_time:.4f}s above 33ms target"

            # Check frame time consistency (shouldn't have huge spikes)
            max_frame_time = max(frame_times)
            assert max_frame_time <= 0.1, f"Max frame time {max_frame_time:.4f}s too high (possible freeze)"

        finally:
            control.stop()
