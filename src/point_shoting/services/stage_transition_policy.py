"""Stage transition policy for managing animation phase progression"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
import time

from ..models.stage import Stage
from ..models.settings import Settings
from ..models.metrics import Metrics


@dataclass
class StageTransitionState:
    """Internal state for stage transition tracking"""
    current_stage: Stage = Stage.PRE_START
    stage_start_time: float = 0.0
    recognition_score: float = 0.0
    chaos_energy: float = 0.0
    stable_frames_count: int = 0
    total_frames: int = 0
    burst_waves_emitted: int = 0


class StageTransitionPolicy:
    """Manages stage transitions based on conditions and fallback timeouts"""
    
    def __init__(self, settings: Settings):
        """
        Initialize stage transition policy
        
        Args:
            settings: Animation settings containing transition parameters
        """
        self.settings = settings
        self.state = StageTransitionState()
        self._last_recognition_score = 0.0
        
    def evaluate(
        self, 
        current_time: float,
        recognition_score: float,
        chaos_energy: float,
        active_particle_count: int,
        total_particle_count: int,
        burst_waves_emitted: int = 0
    ) -> Optional[Stage]:
        """
        Evaluate if stage transition should occur
        
        Args:
            current_time: Current simulation time
            recognition_score: Image similarity score [0.0, 1.0]
            chaos_energy: Aggregate velocity variance/energy
            active_particle_count: Number of active particles
            total_particle_count: Total particle count
            burst_waves_emitted: Number of burst waves completed
            
        Returns:
            Next stage if transition should occur, None to remain in current stage
        """
        # Update internal state
        self.state.recognition_score = recognition_score
        self.state.chaos_energy = chaos_energy
        self.state.total_frames += 1
        self.state.burst_waves_emitted = burst_waves_emitted
        
        # Calculate elapsed time in current stage
        stage_elapsed = current_time - self.state.stage_start_time
        
        # Evaluate transition based on current stage
        next_stage = None
        
        if self.state.current_stage == Stage.PRE_START:
            # PRE_START → BURST (manual trigger, handled by engine)
            pass
            
        elif self.state.current_stage == Stage.BURST:
            # BURST → CHAOS
            next_stage = self._evaluate_burst_to_chaos(stage_elapsed, burst_waves_emitted)
            
        elif self.state.current_stage == Stage.CHAOS:
            # CHAOS → CONVERGING
            next_stage = self._evaluate_chaos_to_converging(stage_elapsed, chaos_energy)
            
        elif self.state.current_stage == Stage.CONVERGING:
            # CONVERGING → FORMATION
            next_stage = self._evaluate_converging_to_formation(stage_elapsed, recognition_score)
            
        elif self.state.current_stage == Stage.FORMATION:
            # FORMATION → FINAL_BREATHING
            next_stage = self._evaluate_formation_to_breathing(stage_elapsed, recognition_score)
            
        elif self.state.current_stage == Stage.FINAL_BREATHING:
            # FINAL_BREATHING → PRE_START (loop mode)
            next_stage = self._evaluate_breathing_to_restart(stage_elapsed)
        
        # If transition decided, update state
        if next_stage is not None:
            self._transition_to_stage(next_stage, current_time)
            
        return next_stage
    
    def _evaluate_burst_to_chaos(self, elapsed: float, waves_emitted: int) -> Optional[Stage]:
        """Evaluate BURST → CHAOS transition"""
        # Primary condition: all burst waves emitted
        if waves_emitted >= self.settings.burst_intensity:
            return Stage.CHAOS
            
        # Fallback: minimum burst duration
        if elapsed >= 2.0:  # 2 second fallback
            return Stage.CHAOS
            
        return None
    
    def _evaluate_chaos_to_converging(self, elapsed: float, chaos_energy: float) -> Optional[Stage]:
        """Evaluate CHAOS → CONVERGING transition"""
        # Energy threshold (particles slowing down)
        energy_threshold = 0.5  # Configurable threshold
        
        if chaos_energy < energy_threshold:
            return Stage.CONVERGING
            
        # Fallback: minimum chaos duration
        if elapsed >= self.settings.chaos_min_duration:
            return Stage.CONVERGING
            
        return None
    
    def _evaluate_converging_to_formation(self, elapsed: float, recognition: float) -> Optional[Stage]:
        """Evaluate CONVERGING → FORMATION transition"""
        # Primary condition: recognition threshold met
        if recognition >= 0.8:
            return Stage.FORMATION
            
        # Fallback: maximum converging time
        if elapsed >= self.settings.formation_fallback_time:
            return Stage.FORMATION
            
        return None
    
    def _evaluate_formation_to_breathing(self, elapsed: float, recognition: float) -> Optional[Stage]:
        """Evaluate FORMATION → FINAL_BREATHING transition"""
        # Check if recognition is stable (non-decreasing for stable frames)
        if recognition >= self._last_recognition_score:
            self.state.stable_frames_count += 1
        else:
            self.state.stable_frames_count = 0
            
        self._last_recognition_score = recognition
        
        # Stable frames threshold reached
        if self.state.stable_frames_count >= self.settings.stable_frames_threshold:
            return Stage.FINAL_BREATHING
            
        # Fallback: minimum formation time
        if elapsed >= 2.0:  # 2 second minimum
            return Stage.FINAL_BREATHING
            
        return None
    
    def _evaluate_breathing_to_restart(self, elapsed: float) -> Optional[Stage]:
        """Evaluate FINAL_BREATHING → PRE_START transition (loop mode)"""
        if not self.settings.loop_mode:
            return None
            
        # Wait for breathing pause duration
        breathing_pause = 3.0  # 3 seconds of breathing
        if elapsed >= breathing_pause:
            return Stage.PRE_START
            
        return None
    
    def _transition_to_stage(self, new_stage: Stage, current_time: float) -> None:
        """Update state for stage transition"""
        self.state.current_stage = new_stage
        self.state.stage_start_time = current_time
        self.state.stable_frames_count = 0  # Reset stability counter
        
    def force_transition_to(self, stage: Stage, current_time: float) -> None:
        """Force transition to specific stage (e.g., for manual control)"""
        self._transition_to_stage(stage, current_time)
        
    def get_current_stage(self) -> Stage:
        """Get current stage"""
        return self.state.current_stage
        
    def get_stage_elapsed_time(self, current_time: float) -> float:
        """Get time elapsed in current stage"""
        return current_time - self.state.stage_start_time
        
    def get_state_snapshot(self) -> Dict[str, Any]:
        """Get snapshot of internal state for debugging"""
        return {
            "current_stage": self.state.current_stage.name,
            "stage_start_time": self.state.stage_start_time,
            "recognition_score": self.state.recognition_score,
            "chaos_energy": self.state.chaos_energy,
            "stable_frames_count": self.state.stable_frames_count,
            "total_frames": self.state.total_frames,
            "burst_waves_emitted": self.state.burst_waves_emitted,
            "last_recognition_score": self._last_recognition_score,
        }
    
    def reset(self) -> None:
        """Reset policy state to initial conditions"""
        self.state = StageTransitionState()
        self._last_recognition_score = 0.0
        
    def update_settings(self, settings: Settings) -> None:
        """Update settings (safe during animation for certain parameters)"""
        # Only update settings that are safe to change mid-animation
        safe_updates = {
            'stable_frames_threshold',
            'recognition_computation_interval',
        }
        
        old_dict = self.settings.to_dict()
        new_dict = settings.to_dict()
        
        for key in safe_updates:
            if key in new_dict:
                setattr(self.settings, key, new_dict[key])
                
    def get_expected_stage_duration(self, stage: Stage) -> float:
        """Get expected duration for a stage (for progress estimation)"""
        durations = {
            Stage.PRE_START: 0.0,
            Stage.BURST: 2.0,
            Stage.CHAOS: self.settings.chaos_min_duration,
            Stage.CONVERGING: self.settings.formation_fallback_time * 0.5,  # Rough estimate
            Stage.FORMATION: 2.0,
            Stage.FINAL_BREATHING: 3.0 if self.settings.loop_mode else float('inf'),
        }
        return durations.get(stage, 1.0)