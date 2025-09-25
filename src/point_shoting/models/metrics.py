"""Metrics data transfer object for performance and state monitoring"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from .stage import Stage


@dataclass
class Metrics:
    """Performance and state metrics for particle animation"""
    
    # Frame rate metrics
    fps_avg: float = 0.0
    """Rolling average FPS over recent frames"""
    
    fps_instant: float = 0.0
    """Instantaneous FPS (last frame)"""
    
    # Particle state metrics
    particle_count: int = 0
    """Total number of particles (should remain constant)"""
    
    active_particle_count: int = 0
    """Number of active particles (equals particle_count in MVP)"""
    
    # Animation state
    stage: Stage = Stage.PRE_START
    """Current animation stage"""
    
    recognition: float = 0.0
    """Image recognition similarity score [0.0, 1.0]"""
    
    chaos_energy: float = 0.0
    """Aggregate velocity variance/energy for stage transitions"""
    
    # Timing information
    stage_elapsed_time: float = 0.0
    """Time elapsed in current stage (seconds)"""
    
    total_elapsed_time: float = 0.0
    """Total time since animation start (seconds)"""
    
    # Performance timing (optional debug info)
    frame_time_ms: float = 0.0
    """Last frame computation time in milliseconds"""
    
    hud_render_time_ms: float = 0.0
    """HUD rendering time in milliseconds"""
    
    # Additional computed metrics
    avg_velocity_magnitude: float = 0.0
    """Average velocity magnitude across all particles"""
    
    max_velocity_magnitude: float = 0.0
    """Maximum velocity magnitude across all particles"""
    
    # Recognition computation state
    last_recognition_frame: int = 0
    """Frame number when recognition was last computed"""
    
    recognition_computation_count: int = 0
    """Total number of recognition computations performed"""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary for serialization/display"""
        return {
            "fps_avg": round(self.fps_avg, 1),
            "fps_instant": round(self.fps_instant, 1),
            "particle_count": self.particle_count,
            "active_particle_count": self.active_particle_count,
            "stage": self.stage.name,
            "stage_display": self.stage.display_name,
            "recognition": round(self.recognition, 3),
            "chaos_energy": round(self.chaos_energy, 3),
            "stage_elapsed_time": round(self.stage_elapsed_time, 2),
            "total_elapsed_time": round(self.total_elapsed_time, 2),
            "frame_time_ms": round(self.frame_time_ms, 2),
            "hud_render_time_ms": round(self.hud_render_time_ms, 2),
            "avg_velocity_magnitude": round(self.avg_velocity_magnitude, 3),
            "max_velocity_magnitude": round(self.max_velocity_magnitude, 3),
            "last_recognition_frame": self.last_recognition_frame,
            "recognition_computation_count": self.recognition_computation_count,
        }
    
    def to_hud_dict(self) -> Dict[str, Any]:
        """Convert to simplified dictionary for HUD display"""
        return {
            "fps": f"{self.fps_avg:.1f} ({self.fps_instant:.1f})",
            "particles": f"{self.active_particle_count:,}/{self.particle_count:,}",
            "stage": self.stage.display_name,
            "recognition": f"{self.recognition:.1%}",
            "time": f"{self.stage_elapsed_time:.1f}s",
            "energy": f"{self.chaos_energy:.2f}",
        }
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance-focused metrics summary"""
        return {
            "fps_avg": self.fps_avg,
            "fps_instant": self.fps_instant,
            "frame_time_ms": self.frame_time_ms,
            "hud_overhead_ms": self.hud_render_time_ms,
            "hud_overhead_percent": (
                (self.hud_render_time_ms / self.frame_time_ms * 100) 
                if self.frame_time_ms > 0 else 0.0
            ),
            "particle_count": self.particle_count,
            "stage": self.stage.name,
        }
    
    def is_recognition_target_met(self, target: float = 0.8) -> bool:
        """Check if recognition target has been met"""
        return self.recognition >= target
    
    def is_fps_below_target(self, target: float = 55.0) -> bool:
        """Check if FPS is below acceptable target"""
        return self.fps_avg < target
    
    def get_stage_progress_estimate(self) -> float:
        """Estimate progress through current stage [0.0, 1.0]"""
        # These are rough estimates based on typical durations
        stage_durations = {
            Stage.PRE_START: 0.0,  # Instant
            Stage.BURST: 2.0,      # ~2 seconds
            Stage.CHAOS: 3.0,      # ~3 seconds  
            Stage.CONVERGING: 3.0, # ~3 seconds
            Stage.FORMATION: 2.0,  # ~2 seconds
            Stage.FINAL_BREATHING: float('inf'),  # Indefinite
        }
        
        expected_duration = stage_durations.get(self.stage, 1.0)
        if expected_duration == float('inf'):
            return 1.0  # Always "complete" for breathing
        
        if expected_duration <= 0:
            return 1.0
        
        progress = min(1.0, self.stage_elapsed_time / expected_duration)
        return progress
    
    def copy(self, **changes: Any) -> "Metrics":
        """Create a copy with optional field changes"""
        current = self.to_dict()
        
        # Handle stage conversion
        if "stage" in changes and isinstance(changes["stage"], str):
            changes["stage"] = Stage.from_string(changes["stage"])
        
        # Filter to only dataclass fields
        valid_fields = {f.name for f in self.__dataclass_fields__.values()}
        filtered_changes = {k: v for k, v in changes.items() if k in valid_fields}
        
        # Create new instance
        new_data = {**current, **filtered_changes}
        
        # Remove computed fields that aren't in dataclass
        dataclass_data = {k: v for k, v in new_data.items() if k in valid_fields}
        
        return Metrics(**dataclass_data)
    
    @classmethod
    def create_initial(cls, particle_count: int) -> "Metrics":
        """Create initial metrics for animation start"""
        return cls(
            particle_count=particle_count,
            active_particle_count=particle_count,
            stage=Stage.PRE_START,
        )
