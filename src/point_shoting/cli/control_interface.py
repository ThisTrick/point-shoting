"""Control interface for user interaction with particle animation system"""

import time
from typing import Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import threading

from ..models.settings import Settings
from ..models.stage import Stage
from ..models.metrics import Metrics
from ..services.particle_engine import ParticleEngine


class ControlState(Enum):
    """Control interface states"""
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPED = "stopped"


@dataclass
class DebounceConfig:
    """Debounce configuration for user controls"""
    restart_debounce_ms: int = 500     # Minimum time between restart calls
    settings_debounce_ms: int = 100    # Minimum time between settings updates
    control_debounce_ms: int = 100     # Minimum time between control actions


@dataclass
class ControlMetrics:
    """Metrics for control interface performance"""
    command_count: int = 0
    debounced_commands: int = 0
    last_restart_time: float = 0.0
    last_settings_time: float = 0.0
    last_control_time: float = 0.0


class ControlInterface:
    """User control interface with debouncing and validation"""
    
    def __init__(self, particle_engine: ParticleEngine):
        """
        Initialize control interface
        
        Args:
            particle_engine: Particle engine instance to control
        """
        self._engine = particle_engine
        self._state = ControlState.IDLE
        self._debounce_config = DebounceConfig()
        self._metrics = ControlMetrics()
        
        # Current session data
        self._current_settings: Optional[Settings] = None
        self._current_image_path: Optional[str] = None
        
        # Event callbacks
        self._on_state_change: Optional[Callable[[ControlState], None]] = None
        self._on_stage_change: Optional[Callable[[Stage], None]] = None
        self._on_error: Optional[Callable[[str], None]] = None
        
        # Thread safety
        self._lock = threading.RLock()
        
    def start(self, settings: Settings, image_path: str) -> bool:
        """
        Start new animation with given settings and image
        
        Args:
            settings: Animation settings
            image_path: Path to target image
            
        Returns:
            True if started successfully, False otherwise
        """
        with self._lock:
            try:
                # Debounce check
                if not self._check_control_debounce():
                    return False
                
                # Initialize engine
                self._engine.init(settings, image_path)
                self._engine.start()
                
                # Update state
                self._current_settings = settings
                self._current_image_path = image_path
                self._state = ControlState.RUNNING
                
                # Increment metrics
                self._metrics.command_count += 1
                
                # Notify state change
                self._notify_state_change(self._state)
                
                return True
                
            except Exception as e:
                self._handle_error(f"Failed to start animation: {str(e)}")
                return False
    
    def pause(self) -> bool:
        """
        Pause current animation
        
        Returns:
            True if paused successfully, False otherwise
        """
        with self._lock:
            try:
                # Debounce check
                if not self._check_control_debounce():
                    return False
                
                # Can only pause if running
                if self._state != ControlState.RUNNING:
                    return False
                
                self._engine.pause()
                self._state = ControlState.PAUSED
                
                # Increment metrics
                self._metrics.command_count += 1
                
                # Notify state change
                self._notify_state_change(self._state)
                
                return True
                
            except Exception as e:
                self._handle_error(f"Failed to pause animation: {str(e)}")
                return False
    
    def resume(self) -> bool:
        """
        Resume paused animation
        
        Returns:
            True if resumed successfully, False otherwise
        """
        with self._lock:
            try:
                # Debounce check
                if not self._check_control_debounce():
                    return False
                
                # Can only resume if paused
                if self._state != ControlState.PAUSED:
                    return False
                
                self._engine.resume()
                self._state = ControlState.RUNNING
                
                # Increment metrics
                self._metrics.command_count += 1
                
                # Notify state change
                self._notify_state_change(self._state)
                
                return True
                
            except Exception as e:
                self._handle_error(f"Failed to resume animation: {str(e)}")
                return False
    
    def restart(self) -> bool:
        """
        Restart current animation from beginning
        
        Returns:
            True if restarted successfully, False otherwise
        """
        with self._lock:
            try:
                # Debounce check for restart specifically
                if not self._check_restart_debounce():
                    return False
                
                # Can only restart if we have current settings and image
                if not self._current_settings or not self._current_image_path:
                    return False
                
                # Stop current animation
                self._engine.stop()
                
                # Restart with same settings
                self._engine.init(self._current_settings, self._current_image_path)
                self._engine.start()
                
                self._state = ControlState.RUNNING
                
                # Update restart time
                self._metrics.last_restart_time = time.time()
                self._metrics.command_count += 1
                
                # Notify state change
                self._notify_state_change(self._state)
                
                return True
                
            except Exception as e:
                self._handle_error(f"Failed to restart animation: {str(e)}")
                return False
    
    def skip_to_final(self) -> bool:
        """
        Skip to final breathing stage
        
        Returns:
            True if skipped successfully, False otherwise
        """
        with self._lock:
            try:
                # Debounce check
                if not self._check_control_debounce():
                    return False
                
                # Can only skip if running or paused
                if self._state not in (ControlState.RUNNING, ControlState.PAUSED):
                    return False
                
                # Force transition to final stage
                # This is a bit of a hack - we'll reset and configure to final stage
                self._engine.stop()
                
                if self._current_settings and self._current_image_path:
                    self._engine.init(self._current_settings, self._current_image_path)
                    
                    # Force to final breathing stage by manipulating internal state
                    # This is implementation-specific and might need adjustment
                    self._engine._stage_state.current_stage = Stage.FINAL_BREATHING
                    self._engine._stage_state.stage_start_time = time.time()
                    
                    self._engine.start()
                    self._state = ControlState.RUNNING
                
                # Increment metrics
                self._metrics.command_count += 1
                
                # Notify state change
                self._notify_state_change(self._state)
                
                return True
                
            except Exception as e:
                self._handle_error(f"Failed to skip to final stage: {str(e)}")
                return False
    
    def apply_settings(self, settings: Settings) -> bool:
        """
        Apply new settings to current animation
        
        Args:
            settings: New settings to apply
            
        Returns:
            True if applied successfully, False otherwise
        """
        with self._lock:
            try:
                # Debounce check for settings
                if not self._check_settings_debounce():
                    return False
                
                # Can only apply settings if engine is initialized
                if not self._engine.is_initialized():
                    return False
                
                # Apply settings through engine
                self._engine.apply_settings(settings)
                self._current_settings = settings
                
                # Update settings time
                self._metrics.last_settings_time = time.time()
                self._metrics.command_count += 1
                
                return True
                
            except Exception as e:
                self._handle_error(f"Failed to apply settings: {str(e)}")
                return False
    
    def stop(self) -> bool:
        """
        Stop current animation
        
        Returns:
            True if stopped successfully, False otherwise
        """
        with self._lock:
            try:
                # Debounce check
                if not self._check_control_debounce():
                    return False
                
                self._engine.stop()
                self._state = ControlState.STOPPED
                
                # Increment metrics
                self._metrics.command_count += 1
                
                # Notify state change
                self._notify_state_change(self._state)
                
                return True
                
            except Exception as e:
                self._handle_error(f"Failed to stop animation: {str(e)}")
                return False
    
    def get_state(self) -> ControlState:
        """Get current control state"""
        return self._state
    
    def get_current_stage(self) -> Optional[Stage]:
        """Get current animation stage"""
        if not self._engine.is_initialized():
            return None
        return self._engine.get_current_stage()
    
    def get_metrics(self) -> Optional[Metrics]:
        """Get current engine metrics"""
        if not self._engine.is_initialized():
            return None
        return self._engine.get_metrics()
    
    def is_running(self) -> bool:
        """Check if animation is currently running"""
        return self._state == ControlState.RUNNING
    
    def is_paused(self) -> bool:
        """Check if animation is currently paused"""
        return self._state == ControlState.PAUSED
    
    def is_active(self) -> bool:
        """Check if animation is active (running or paused)"""
        return self._state in (ControlState.RUNNING, ControlState.PAUSED)
    
    def can_pause(self) -> bool:
        """Check if pause action is available"""
        return self._state == ControlState.RUNNING
    
    def can_resume(self) -> bool:
        """Check if resume action is available"""
        return self._state == ControlState.PAUSED
    
    def can_restart(self) -> bool:
        """Check if restart action is available"""
        return (self._current_settings is not None and 
                self._current_image_path is not None and
                self._check_restart_debounce())
    
    def can_apply_settings(self) -> bool:
        """Check if settings can be applied"""
        current_stage = self.get_current_stage()
        return (current_stage is not None and 
                current_stage.allows_settings_change() and
                self._check_settings_debounce())
    
    def _check_control_debounce(self) -> bool:
        """Check if control action is allowed (debounce)"""
        current_time = time.time()
        time_since_last = (current_time - self._metrics.last_control_time) * 1000
        
        if time_since_last < self._debounce_config.control_debounce_ms:
            self._metrics.debounced_commands += 1
            return False
        
        self._metrics.last_control_time = current_time
        return True
    
    def _check_restart_debounce(self) -> bool:
        """Check if restart action is allowed (debounce)"""
        current_time = time.time()
        time_since_last = (current_time - self._metrics.last_restart_time) * 1000
        
        if time_since_last < self._debounce_config.restart_debounce_ms:
            self._metrics.debounced_commands += 1
            return False
        
        return True
    
    def _check_settings_debounce(self) -> bool:
        """Check if settings action is allowed (debounce)"""
        current_time = time.time()
        time_since_last = (current_time - self._metrics.last_settings_time) * 1000
        
        if time_since_last < self._debounce_config.settings_debounce_ms:
            self._metrics.debounced_commands += 1
            return False
        
        return True
    
    def configure_debounce(
        self,
        restart_ms: Optional[int] = None,
        settings_ms: Optional[int] = None,
        control_ms: Optional[int] = None
    ) -> None:
        """
        Configure debounce timing
        
        Args:
            restart_ms: Restart debounce time in milliseconds
            settings_ms: Settings debounce time in milliseconds  
            control_ms: General control debounce time in milliseconds
        """
        if restart_ms is not None:
            self._debounce_config.restart_debounce_ms = max(0, restart_ms)
        if settings_ms is not None:
            self._debounce_config.settings_debounce_ms = max(0, settings_ms)
        if control_ms is not None:
            self._debounce_config.control_debounce_ms = max(0, control_ms)
    
    def set_event_callbacks(
        self,
        on_state_change: Optional[Callable[[ControlState], None]] = None,
        on_stage_change: Optional[Callable[[Stage], None]] = None,
        on_error: Optional[Callable[[str], None]] = None
    ) -> None:
        """
        Set event callback functions
        
        Args:
            on_state_change: Called when control state changes
            on_stage_change: Called when animation stage changes
            on_error: Called when errors occur
        """
        self._on_state_change = on_state_change
        self._on_stage_change = on_stage_change
        self._on_error = on_error
    
    def _notify_state_change(self, new_state: ControlState) -> None:
        """Notify state change callback"""
        if self._on_state_change:
            try:
                self._on_state_change(new_state)
            except Exception as e:
                print(f"State change callback error: {e}")
    
    def _notify_stage_change(self, new_stage: Stage) -> None:
        """Notify stage change callback"""
        if self._on_stage_change:
            try:
                self._on_stage_change(new_stage)
            except Exception as e:
                print(f"Stage change callback error: {e}")
    
    def _handle_error(self, error_msg: str) -> None:
        """Handle error with callback notification"""
        if self._on_error:
            try:
                self._on_error(error_msg)
            except Exception as e:
                print(f"Error callback error: {e}")
        else:
            print(f"Control Interface Error: {error_msg}")
    
    def get_control_stats(self) -> Dict[str, Any]:
        """Get control interface statistics"""
        return {
            "state": self._state.value,
            "engine_initialized": self._engine.is_initialized(),
            "engine_running": self._engine.is_running(),
            "engine_paused": self._engine.is_paused(),
            "command_count": self._metrics.command_count,
            "debounced_commands": self._metrics.debounced_commands,
            "has_current_session": (self._current_settings is not None and 
                                  self._current_image_path is not None),
            "debounce_config": {
                "restart_ms": self._debounce_config.restart_debounce_ms,
                "settings_ms": self._debounce_config.settings_debounce_ms,
                "control_ms": self._debounce_config.control_debounce_ms,
            },
            "capabilities": {
                "can_pause": self.can_pause(),
                "can_resume": self.can_resume(),
                "can_restart": self.can_restart(),
                "can_apply_settings": self.can_apply_settings(),
            }
        }
    
    def reset_metrics(self) -> None:
        """Reset control interface metrics"""
        self._metrics = ControlMetrics()
    
    def get_current_settings(self) -> Optional[Settings]:
        """Get current settings"""
        return self._current_settings
    
    def get_current_image_path(self) -> Optional[str]:
        """Get current image path"""
        return self._current_image_path