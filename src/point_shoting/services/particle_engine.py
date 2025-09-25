"""Particle engine for point shooting animation system"""

import time
import numpy as np
from typing import Dict, Any, Optional, Tuple, Callable
from dataclasses import dataclass, field
from enum import Enum

from ..models.stage import Stage
from ..models.settings import Settings
from ..models.particle_arrays import ParticleArrays, allocate_particle_arrays, map_image_to_targets, initialize_burst_positions
from ..models.metrics import Metrics
from ..services.stage_transition_policy import StageTransitionPolicy
from ..services.color_mapper import ColorMapper
from ..services.breathing_oscillator import BreathingOscillator
from ..lib.math_utils import (
    clamp_positions_inplace, calculate_distances, calculate_magnitudes,
    calculate_chaos_energy, calculate_recognition_score
)

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


@dataclass
class PhysicsParams:
    """Physics simulation parameters"""
    damping: float = 0.98           # Velocity damping factor
    attraction_strength: float = 2.0  # Attraction to target strength
    repulsion_strength: float = 0.5   # Inter-particle repulsion
    noise_strength: float = 0.1       # Random motion strength
    max_velocity: float = 10.0        # Maximum particle velocity
    dt: float = 1.0 / 60.0           # Time step (60 FPS)


@dataclass  
class StageState:
    """State tracking for current stage"""
    current_stage: Stage = Stage.PRE_START
    stage_start_time: float = 0.0
    stage_elapsed: float = 0.0
    stage_progress: float = 0.0
    transition_ready: bool = False


class ParticleEngine:
    """Core particle simulation engine"""
    
    def __init__(self) -> None:
        """Initialize particle engine"""
        self._initialized = False
        self._running = False
        self._paused = False
        
        # Core state
        self._settings = Settings()
        self._particles: Optional[ParticleArrays] = None
        self._stage_state = StageState()
        self._physics_params = PhysicsParams()
        
        # Services - will be initialized in init()
        self._transition_policy: Optional[StageTransitionPolicy] = None
        self._color_mapper = ColorMapper()
        self._breathing_oscillator = BreathingOscillator()
        
        # Timing
        self._start_time = 0.0
        self._last_step_time = 0.0
        self._frame_count = 0
        self._fps_history = []
        self._fps_history_size = 30
        
        # Target image data
        self._target_image: Optional[Image.Image] = None
        self._particles.target = None
        
        # Performance tracking
        self._step_times = []
        self._step_time_history_size = 100
        
    def init(self, settings: Settings, image_path: str) -> None:
        """
        Initialize particle engine with settings and target image
        
        Args:
            settings: Particle system settings
            image_path: Path to target image file
        """
        if not PIL_AVAILABLE:
            raise RuntimeError("PIL/Pillow required for image loading")
        
        # Load and validate image
        try:
            self._target_image = Image.open(image_path)
            if self._target_image.mode != 'RGB':
                self._target_image = self._target_image.convert('RGB')
        except Exception as e:
            raise RuntimeError(f"Failed to load image {image_path}: {e}")
        
        # Store settings
        self._settings = settings
        
        # Initialize transition policy with settings
        self._transition_policy = StageTransitionPolicy(settings)
        
        # Allocate particle arrays
        particle_count = settings.get_particle_count()
        self._particles = allocate_particle_arrays(particle_count)
        
        # Generate target positions from image
        image_array = np.array(self._target_image)
        map_image_to_targets(self._particles, image_array)
        
        # Initialize color mapping
        self._color_mapper.build_palettes(self._target_image, settings.color_mode)
        
        # Configure breathing oscillator
        self._breathing_oscillator.configure(
            frequency=2.0,  # 2 Hz breathing
            amplitude=0.05,  # 5% amplitude
            decay=0.0
        )
        
        # Reset state
        self._stage_state = StageState()
        self._frame_count = 0
        self._fps_history.clear()
        self._step_times.clear()
        
        # Initialize particles to burst positions
        initialize_burst_positions(self._particles)
        
        self._initialized = True
        self._running = False
        self._paused = False
    
    def step(self) -> None:
        """
        Advance simulation by one time step
        
        Raises:
            RuntimeError: If called before init()
        """
        if not self._initialized:
            raise RuntimeError("ParticleEngine.step() called before init()")
        
        if self._paused or not self._running:
            return
        
        step_start = time.perf_counter()
        
        # Update timing
        current_time = time.time()
        if self._start_time == 0:
            self._start_time = current_time
        
        dt = current_time - self._last_step_time if self._last_step_time > 0 else self._physics_params.dt
        self._last_step_time = current_time
        
        # Update stage timing
        self._update_stage_timing(current_time)
        
        # Update physics based on current stage
        self._update_stage_physics(dt)
        
        # Check for stage transitions
        self._check_stage_transitions()
        
        # Update particle colors
        self._update_particle_colors()
        
        # Performance tracking
        step_time = time.perf_counter() - step_start
        self._step_times.append(step_time)
        if len(self._step_times) > self._step_time_history_size:
            self._step_times.pop(0)
        
        # FPS tracking
        self._frame_count += 1
        if len(self._fps_history) >= self._fps_history_size:
            self._fps_history.pop(0)
        
        if dt > 0:
            fps = 1.0 / dt
            self._fps_history.append(fps)
    
    def _update_stage_timing(self, current_time: float) -> None:
        """Update stage timing information"""
        if self._stage_state.stage_start_time == 0:
            self._stage_state.stage_start_time = current_time
        
        self._stage_state.stage_elapsed = current_time - self._stage_state.stage_start_time
        
        # Calculate stage progress (rough approximation)
        expected_duration = self._get_expected_stage_duration(self._stage_state.current_stage)
        if expected_duration > 0:
            self._stage_state.stage_progress = min(1.0, self._stage_state.stage_elapsed / expected_duration)
        else:
            self._stage_state.stage_progress = 0.0
    
    def _get_expected_stage_duration(self, stage: Stage) -> float:
        """Get expected duration for a stage in seconds"""
        durations = {
            Stage.PRE_START: 2.0,
            Stage.BURST: 3.0,
            Stage.CHAOS: 5.0,
            Stage.CONVERGING: 4.0,
            Stage.FORMATION: 3.0,
            Stage.FINAL_BREATHING: 10.0,
        }
        return durations.get(stage, 5.0)
    
    def _update_stage_physics(self, dt: float) -> None:
        """Update particle physics based on current stage"""
        if self._particles is None or self._particles.target is None:
            return
        
        stage = self._stage_state.current_stage
        
        if stage == Stage.PRE_START:
            self._update_pre_start_physics(dt)
        elif stage == Stage.BURST:
            self._update_burst_physics(dt)
        elif stage == Stage.CHAOS:
            self._update_chaos_physics(dt)
        elif stage == Stage.CONVERGING:
            self._update_converging_physics(dt)
        elif stage == Stage.FORMATION:
            self._update_formation_physics(dt)
        elif stage == Stage.FINAL_BREATHING:
            self._update_breathing_physics(dt)
    
    def _update_pre_start_physics(self, dt: float) -> None:
        """Update physics for PRE_START stage"""
        # Particles are stationary, maybe small breathing effect
        breathing_offset = self._breathing_oscillator.get_batch_oscillation(
            self._stage_state.stage_elapsed, 
            len(self._particles.position)
        ) * 0.01  # Very small breathing
        
        # Apply minimal breathing to positions
        center = np.array([0.5, 0.5])
        for i in range(len(self._particles.position)):
            offset_vec = self._particles.position[i] - center
            self._particles.position[i] = center + offset_vec * (1.0 + breathing_offset[i])
    
    def _update_burst_physics(self, dt: float) -> None:
        """Update physics for BURST stage"""
        # Explosive outward motion from center
        center = np.array([0.5, 0.5])
        
        # Apply burst force
        burst_strength = 5.0 * (1.0 - self._stage_state.stage_progress)  # Decreases over time
        
        for i in range(len(self._particles.position)):
            # Direction from center
            direction = self._particles.position[i] - center
            distance = np.linalg.norm(direction)
            
            if distance > 0:
                direction /= distance
                # Apply burst force
                force = direction * burst_strength * dt
                self._particles.velocity[i] += force
        
        # Apply damping
        self._particles.velocity *= self._physics_params.damping
        
        # Update positions
        self._particles.position += self._particles.velocity * dt
        
        # Clamp to bounds
        clamp_positions_inplace(self._particles.position, 0.0, 1.0)
    
    def _update_chaos_physics(self, dt: float) -> None:
        """Update physics for CHAOS stage"""
        # Random chaotic motion with some attraction to targets
        
        # Add random forces
        random_forces = np.random.uniform(-1, 1, self._particles.velocity.shape) * self._physics_params.noise_strength
        self._particles.velocity += random_forces * dt
        
        # Weak attraction to targets
        target_attraction = 0.5  # Weak attraction during chaos
        for i in range(len(self._particles.position)):
            target_dir = self._particles.target[i] - self._particles.position[i]
            target_distance = np.linalg.norm(target_dir)
            
            if target_distance > 0:
                target_dir /= target_distance
                attraction_force = target_dir * target_attraction * dt
                self._particles.velocity[i] += attraction_force
        
        # Apply damping
        self._particles.velocity *= self._physics_params.damping
        
        # Update positions
        self._particles.position += self._particles.velocity * dt
        
        # Clamp to bounds
        clamp_positions_inplace(self._particles.position, 0.0, 1.0)
    
    def _update_converging_physics(self, dt: float) -> None:
        """Update physics for CONVERGING stage"""
        # Particles converge toward their target positions
        
        attraction_strength = self._physics_params.attraction_strength * 2.0  # Stronger attraction
        
        for i in range(len(self._particles.position)):
            # Calculate attraction to target
            target_dir = self._particles.target[i] - self._particles.position[i]
            target_distance = np.linalg.norm(target_dir)
            
            if target_distance > 0.01:  # Only attract if not very close
                target_dir /= target_distance
                # Stronger attraction as we converge
                attraction_force = target_dir * attraction_strength * dt
                self._particles.velocity[i] += attraction_force
        
        # Apply damping
        self._particles.velocity *= self._physics_params.damping ** 2  # Stronger damping
        
        # Update positions
        self._particles.position += self._particles.velocity * dt
        
        # Clamp to bounds
        clamp_positions_inplace(self._particles.position, 0.0, 1.0)
    
    def _update_formation_physics(self, dt: float) -> None:
        """Update physics for FORMATION stage"""
        # Particles settle into final positions with stabilization
        
        stabilization_strength = 3.0
        
        for i in range(len(self._particles.position)):
            # Strong attraction to exact target position
            target_dir = self._particles.target[i] - self._particles.position[i]
            target_distance = np.linalg.norm(target_dir)
            
            if target_distance > 0.001:  # Very precise targeting
                target_dir /= target_distance
                stabilization_force = target_dir * stabilization_strength * dt
                self._particles.velocity[i] += stabilization_force
        
        # Heavy damping for stability
        self._particles.velocity *= self._physics_params.damping ** 3
        
        # Update positions
        self._particles.position += self._particles.velocity * dt
        
        # Clamp to bounds
        clamp_positions_inplace(self._particles.position, 0.0, 1.0)
    
    def _update_breathing_physics(self, dt: float) -> None:
        """Update physics for FINAL_BREATHING stage"""
        # Particles breathe around their target positions
        
        center = np.array([0.5, 0.5])  # Image center
        
        # Apply radial breathing effect
        breathed_positions = self._breathing_oscillator.get_radial_breathing(
            self._stage_state.stage_elapsed,
            center,
            self._particles.target
        )
        
        # Gently move particles toward breathed positions
        breathing_attraction = 1.0
        
        for i in range(len(self._particles.position)):
            # Attract to breathing position
            breathing_dir = breathed_positions[i] - self._particles.position[i]
            breathing_distance = np.linalg.norm(breathing_dir)
            
            if breathing_distance > 0:
                breathing_dir /= breathing_distance
                breathing_force = breathing_dir * breathing_attraction * dt
                self._particles.velocity[i] += breathing_force
        
        # Apply damping
        self._particles.velocity *= self._physics_params.damping
        
        # Update positions
        self._particles.position += self._particles.velocity * dt
        
        # Clamp to bounds
        clamp_positions_inplace(self._particles.position, 0.0, 1.0)
    
    def _check_stage_transitions(self) -> None:
        """Check and handle stage transitions"""
        if self._particles is None:
            return
        
        # Use transition policy to evaluate stage changes
        if self._transition_policy is None:
            return
        
        # Get current metrics and evaluate transition
        current_time = time.time() - self._start_time
        recognition_score = self._calculate_recognition_score()
        chaos_energy = self._calculate_chaos_energy()
        
        next_stage = self._transition_policy.evaluate(
            current_time=current_time,
            recognition_score=recognition_score,
            chaos_energy=chaos_energy,
            active_particle_count=self._particles.particle_count,
            total_particle_count=self._particles.particle_count,
            burst_waves_emitted=0
        )
        
        if next_stage is not None and next_stage != self._stage_state.current_stage:
            old_stage = self._stage_state.current_stage
            new_stage = next_stage
            
            if new_stage != old_stage:
                self._transition_to_stage(new_stage)
    
    def _transition_to_stage(self, new_stage: Stage) -> None:
        """Transition to a new stage"""
        self._stage_state.current_stage = new_stage
        self._stage_state.stage_start_time = time.time()
        self._stage_state.stage_elapsed = 0.0
        self._stage_state.stage_progress = 0.0
        
        # Stage-specific initialization
        if new_stage == Stage.BURST:
            # Reset particles to burst configuration
            initialize_burst_positions(self._particles)
        elif new_stage == Stage.FINAL_BREATHING:
            # Configure breathing for final stage
            self._breathing_oscillator.configure(
                frequency=1.5,   # Slower breathing in final stage
                amplitude=0.03,  # Smaller amplitude
                decay=0.0
            )
    
    def _update_particle_colors(self) -> None:
        """Update particle colors based on current positions"""
        if self._particles is None or self._particles.target is None:
            return
        
        # Batch color assignment for performance
        colors = self._color_mapper.batch_color_assignment(
            self._particles.target,
            self._settings.color_mode
        )
        
        # Apply colors to particles
        self._particles.color_rgba = colors
    
    def get_current_stage(self) -> Stage:
        """Get current animation stage"""
        return self._stage_state.current_stage
    
    def get_metrics(self) -> Metrics:
        """Get current system metrics"""
        # Calculate FPS
        fps_avg = sum(self._fps_history) / len(self._fps_history) if self._fps_history else 0.0
        fps_instant = self._fps_history[-1] if self._fps_history else 0.0
        
        # Calculate frame time
        frame_time_ms = (sum(self._step_times) / len(self._step_times)) * 1000 if self._step_times else 0.0
        
        # Particle count
        particle_count = len(self._particles.position) if self._particles else 0
        
        # Calculate recognition and chaos
        recognition = self._calculate_recognition_score()
        chaos_energy = self._calculate_chaos_energy()
        
        return Metrics(
            fps_avg=fps_avg,
            fps_instant=fps_instant,
            frame_time_ms=frame_time_ms,
            particle_count=particle_count,
            active_particle_count=particle_count,
            stage=self._stage_state.current_stage,
            recognition=recognition,
            chaos_energy=chaos_energy,
            stage_elapsed_time=self._stage_state.stage_elapsed,
            total_elapsed_time=time.time() - self._start_time if self._start_time > 0 else 0.0,
        )
    
    def get_particle_snapshot(self) -> Optional[ParticleArrays]:
        """Get current particle state snapshot"""
        if self._particles is None:
            return None
        
        # Return a copy to avoid modification
        snapshot = ParticleArrays(
            position=self._particles.position.copy(),
            velocity=self._particles.velocity.copy(),
            color_rgba=self._particles.color_rgba.copy(),
            target=self._particles.target.copy(),
            active=self._particles.active.copy(),
            stage_mask=self._particles.stage_mask.copy(),
            _particle_count=self._particles._particle_count
        )
        
        return snapshot
    
    def apply_settings(self, settings: Settings) -> None:
        """Apply new settings to the engine"""
        if not self._stage_state.current_stage.allows_settings_change():
            return  # Ignore settings changes during certain stages
        
        old_particle_count = self._settings.get_particle_count()
        new_particle_count = settings.get_particle_count()
        
        self._settings = settings
        
        # If particle count changed, need to reinitialize
        if new_particle_count != old_particle_count and self._target_image is not None:
            # Preserve current stage
            current_stage = self._stage_state.current_stage
            stage_elapsed = self._stage_state.stage_elapsed
            
            # Reallocate particles
            self._particles = allocate_particle_arrays(new_particle_count)
            # Convert PIL Image to numpy array and map to targets
            import numpy as np
            image_array = np.array(self._target_image)
            map_image_to_targets(self._particles, image_array)
            
            # Restore stage state
            self._stage_state.current_stage = current_stage
            self._stage_state.stage_elapsed = stage_elapsed
        
        # Update color mapping
        if self._target_image is not None:
            self._color_mapper.build_palettes(self._target_image, settings.color_mode)
    
    def start(self) -> None:
        """Start the particle engine"""
        if not self._initialized:
            raise RuntimeError("Cannot start engine before initialization")
        
        self._running = True
        self._paused = False
        
        if self._start_time == 0:
            self._start_time = time.time()
    
    def pause(self) -> None:
        """Pause the particle engine"""
        self._paused = True
    
    def resume(self) -> None:
        """Resume the particle engine"""
        self._paused = False
    
    def stop(self) -> None:
        """Stop the particle engine"""
        self._running = False
        self._paused = False
    
    def is_running(self) -> bool:
        """Check if engine is running"""
        return self._running and not self._paused
    
    def is_paused(self) -> bool:
        """Check if engine is paused"""
        return self._paused
    
    def is_initialized(self) -> bool:
        """Check if engine is initialized"""
        return self._initialized
    
    def reset(self) -> None:
        """Reset engine to initial state"""
        self._stage_state = StageState()
        self._frame_count = 0
        self._fps_history.clear()
        self._step_times.clear()
        self._start_time = 0.0
        self._last_step_time = 0.0
        
        if self._particles is not None:
            initialize_burst_positions(self._particles)
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get detailed performance statistics"""
        stats = {
            "initialized": self._initialized,
            "running": self._running,
            "paused": self._paused,
            "frame_count": self._frame_count,
            "particle_count": len(self._particles.position) if self._particles else 0,
        }
        
        if self._fps_history:
            stats["fps"] = {
                "current": self._fps_history[-1],
                "average": sum(self._fps_history) / len(self._fps_history),
                "min": min(self._fps_history),
                "max": max(self._fps_history),
            }
        
        if self._step_times:
            step_times_ms = [t * 1000 for t in self._step_times]
            stats["step_time_ms"] = {
                "current": step_times_ms[-1],
                "average": sum(step_times_ms) / len(step_times_ms),
                "min": min(step_times_ms),
                "max": max(step_times_ms),
            }
        
        return stats
    
    def _calculate_recognition_score(self) -> float:
        """Calculate how well particles match target image positions."""
        if self._particles is None:
            return 0.0
        
        return calculate_recognition_score(
            self._particles.position, 
            self._particles.target
        )
    
    def _calculate_chaos_energy(self) -> float:
        """Calculate particle chaos energy from velocity variance."""
        if self._particles is None:
            return 0.0
        
        return calculate_chaos_energy(self._particles.velocity)
