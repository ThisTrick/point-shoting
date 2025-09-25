"""HUD rendering service with performance budget constraints"""

from typing import Dict, Any, Optional, List, Tuple
import time
from dataclasses import dataclass, field
from enum import Enum

try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.text import Text
    from rich.layout import Layout
    from rich.table import Table
    from rich.progress import Progress, BarColumn, TextColumn
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

from ..models.metrics import Metrics
from ..models.stage import Stage


class HUDLevel(Enum):
    """HUD detail levels for performance control"""
    MINIMAL = "minimal"      # Essential info only
    STANDARD = "standard"    # Normal HUD
    DETAILED = "detailed"    # Full diagnostics
    

@dataclass 
class PerformanceBudget:
    """Performance budget constraints for HUD rendering"""
    max_render_time_ms: float = 5.0    # Maximum render time per frame
    max_memory_mb: float = 10.0         # Maximum memory usage
    max_updates_per_sec: int = 30       # Maximum HUD update rate
    

@dataclass
class HUDMetrics:
    """Internal HUD performance metrics"""
    render_times_ms: List[float] = field(default_factory=list)
    memory_usage_mb: float = 0.0
    update_count: int = 0
    last_update_time: float = 0.0
    budget_violations: int = 0
    

class HUDRenderer:
    """Renders HUD overlay with performance budget management"""
    
    def __init__(self):
        """Initialize HUD renderer"""
        self._console = Console() if RICH_AVAILABLE else None
        self._budget = PerformanceBudget()
        self._metrics = HUDMetrics()
        self._level = HUDLevel.STANDARD
        self._enabled = True
        self._last_content = ""
        self._render_history = []
        self._max_history = 100
        
    def configure(
        self,
        level: HUDLevel = HUDLevel.STANDARD,
        max_render_time_ms: float = 5.0,
        max_memory_mb: float = 10.0,
        max_updates_per_sec: int = 30
    ) -> None:
        """
        Configure HUD rendering parameters
        
        Args:
            level: HUD detail level
            max_render_time_ms: Maximum render time per frame
            max_memory_mb: Maximum memory usage
            max_updates_per_sec: Maximum update rate
        """
        self._level = level
        self._budget = PerformanceBudget(
            max_render_time_ms=max_render_time_ms,
            max_memory_mb=max_memory_mb,
            max_updates_per_sec=max_updates_per_sec
        )
        
    def render_hud(self, metrics: Metrics, additional_info: Optional[Dict[str, Any]] = None) -> bool:
        """
        Render HUD overlay with performance monitoring
        
        Args:
            metrics: Current system metrics
            additional_info: Optional additional information to display
            
        Returns:
            True if render completed within budget, False if budget exceeded
        """
        if not self._enabled:
            return True
            
        start_time = time.perf_counter()
        
        # Check update rate limit
        current_time = time.time()
        if current_time - self._metrics.last_update_time < (1.0 / self._budget.max_updates_per_sec):
            return True  # Skip update to maintain rate limit
        
        try:
            success = self._perform_render(metrics, additional_info)
            
            # Calculate render time
            render_time_ms = (time.perf_counter() - start_time) * 1000
            self._metrics.render_times_ms.append(render_time_ms)
            
            # Limit history size
            if len(self._metrics.render_times_ms) > self._max_history:
                self._metrics.render_times_ms.pop(0)
            
            # Check budget compliance
            budget_ok = render_time_ms <= self._budget.max_render_time_ms
            if not budget_ok:
                self._metrics.budget_violations += 1
                # Auto-adjust to lower detail level if budget is consistently exceeded
                self._auto_adjust_level()
            
            self._metrics.update_count += 1
            self._metrics.last_update_time = current_time
            
            return budget_ok and success
            
        except Exception as e:
            # Graceful degradation on render errors
            self._fallback_render(str(e))
            return False
    
    def _perform_render(self, metrics: Metrics, additional_info: Optional[Dict[str, Any]]) -> bool:
        """Perform the actual HUD rendering"""
        if not RICH_AVAILABLE:
            return self._fallback_render_text(metrics, additional_info)
        
        if self._level == HUDLevel.MINIMAL:
            content = self._render_minimal(metrics)
        elif self._level == HUDLevel.DETAILED:
            content = self._render_detailed(metrics, additional_info)
        else:
            content = self._render_standard(metrics, additional_info)
        
        # Only update if content changed (performance optimization)
        if content != self._last_content:
            self._console.clear()
            self._console.print(content)
            self._last_content = content
        
        return True
    
    def _render_minimal(self, metrics: Metrics) -> Panel:
        """Render minimal HUD (stage + FPS only)"""
        text = Text()
        text.append(f"Stage: {metrics.current_stage.name}\n", style="bold cyan")
        text.append(f"FPS: {metrics.fps:.1f}", style="green" if metrics.fps >= 55 else "yellow")
        
        return Panel(text, title="Status", border_style="blue")
    
    def _render_standard(self, metrics: Metrics, additional_info: Optional[Dict[str, Any]]) -> Panel:
        """Render standard HUD"""
        table = Table(show_header=False, show_edge=False, pad_edge=False)
        table.add_column("Label", style="cyan")
        table.add_column("Value", style="white")
        
        # Core metrics
        table.add_row("Stage", f"{metrics.current_stage.name}")
        table.add_row("FPS", f"{metrics.fps:.1f}")
        table.add_row("Particles", f"{metrics.particle_count:,}")
        table.add_row("Stage Progress", f"{metrics.stage_progress:.1%}")
        
        # Performance metrics
        fps_style = "green" if metrics.fps >= 55 else "red" if metrics.fps < 30 else "yellow"
        table.add_row("Performance", f"[{fps_style}]{metrics.fps:.1f} FPS[/{fps_style}]")
        
        if metrics.frame_time_ms > 0:
            frame_style = "green" if metrics.frame_time_ms <= 16.7 else "yellow"
            table.add_row("Frame Time", f"[{frame_style}]{metrics.frame_time_ms:.1f}ms[/{frame_style}]")
        
        # Additional info
        if additional_info:
            for key, value in additional_info.items():
                table.add_row(str(key), str(value))
        
        return Panel(table, title=f"Point Shooting - {metrics.current_stage.name}", border_style="blue")
    
    def _render_detailed(self, metrics: Metrics, additional_info: Optional[Dict[str, Any]]) -> Panel:
        """Render detailed HUD with full diagnostics"""
        layout = Layout()
        
        # Main metrics table  
        main_table = Table(title="System Metrics")
        main_table.add_column("Metric", style="cyan")
        main_table.add_column("Value", style="white")
        main_table.add_column("Status", style="white")
        
        # Core metrics with status indicators
        fps_status = "🟢" if metrics.fps >= 55 else "🟡" if metrics.fps >= 30 else "🔴"
        main_table.add_row("FPS", f"{metrics.fps:.1f}", fps_status)
        
        main_table.add_row("Frame Time", f"{metrics.frame_time_ms:.1f}ms", 
                          "🟢" if metrics.frame_time_ms <= 16.7 else "🟡")
        
        main_table.add_row("Particles", f"{metrics.particle_count:,}", "")
        main_table.add_row("Stage", metrics.current_stage.name, "")
        main_table.add_row("Progress", f"{metrics.stage_progress:.1%}", "")
        
        # HUD performance metrics
        perf_table = Table(title="HUD Performance")
        perf_table.add_column("Metric", style="cyan")
        perf_table.add_column("Value", style="white")
        
        if self._metrics.render_times_ms:
            avg_render_time = sum(self._metrics.render_times_ms) / len(self._metrics.render_times_ms)
            max_render_time = max(self._metrics.render_times_ms)
            perf_table.add_row("Avg Render Time", f"{avg_render_time:.1f}ms")
            perf_table.add_row("Max Render Time", f"{max_render_time:.1f}ms")
        
        perf_table.add_row("Budget Violations", str(self._metrics.budget_violations))
        perf_table.add_row("Update Count", str(self._metrics.update_count))
        perf_table.add_row("Detail Level", self._level.value)
        
        # Combine tables
        layout.split_column(
            Layout(main_table, name="main"),
            Layout(perf_table, name="perf")
        )
        
        return Panel(layout, title="Detailed Diagnostics", border_style="blue")
    
    def _fallback_render_text(self, metrics: Metrics, additional_info: Optional[Dict[str, Any]]) -> bool:
        """Fallback text rendering when Rich is not available"""
        lines = [
            f"=== Point Shooting HUD ===",
            f"Stage: {metrics.current_stage.name}",
            f"FPS: {metrics.fps:.1f}",
            f"Particles: {metrics.particle_count:,}",
            f"Progress: {metrics.stage_progress:.1%}",
        ]
        
        if additional_info:
            lines.append("--- Additional Info ---")
            for key, value in additional_info.items():
                lines.append(f"{key}: {value}")
        
        print("\n".join(lines))
        return True
    
    def _fallback_render(self, error_msg: str) -> bool:
        """Fallback rendering for errors"""
        print(f"HUD Render Error: {error_msg}")
        return False
    
    def _auto_adjust_level(self) -> None:
        """Automatically adjust detail level based on performance"""
        if self._metrics.budget_violations > 5:  # Multiple violations
            if self._level == HUDLevel.DETAILED:
                self._level = HUDLevel.STANDARD
            elif self._level == HUDLevel.STANDARD:
                self._level = HUDLevel.MINIMAL
            # Reset violation counter after adjustment
            self._metrics.budget_violations = 0
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get HUD performance statistics"""
        stats = {
            "enabled": self._enabled,
            "level": self._level.value,
            "budget": {
                "max_render_time_ms": self._budget.max_render_time_ms,
                "max_memory_mb": self._budget.max_memory_mb,
                "max_updates_per_sec": self._budget.max_updates_per_sec,
            },
            "metrics": {
                "update_count": self._metrics.update_count,
                "budget_violations": self._metrics.budget_violations,
                "rich_available": RICH_AVAILABLE,
            }
        }
        
        if self._metrics.render_times_ms:
            stats["metrics"]["avg_render_time_ms"] = sum(self._metrics.render_times_ms) / len(self._metrics.render_times_ms)
            stats["metrics"]["max_render_time_ms"] = max(self._metrics.render_times_ms)
            stats["metrics"]["min_render_time_ms"] = min(self._metrics.render_times_ms)
        
        return stats
    
    def set_enabled(self, enabled: bool) -> None:
        """Enable/disable HUD rendering"""
        self._enabled = enabled
    
    def is_enabled(self) -> bool:
        """Check if HUD rendering is enabled"""
        return self._enabled
    
    def reset_metrics(self) -> None:
        """Reset internal performance metrics"""
        self._metrics = HUDMetrics()
        self._render_history.clear()
    
    def force_level(self, level: HUDLevel) -> None:
        """Force specific detail level (disables auto-adjustment)"""
        self._level = level
        self._metrics.budget_violations = 0  # Reset violations after manual change
    
    def render_progress_bar(self, progress: float, label: str = "Progress") -> bool:
        """
        Render a progress bar
        
        Args:
            progress: Progress value (0.0 to 1.0)
            label: Progress bar label
            
        Returns:
            True if render succeeded
        """
        if not self._enabled or not RICH_AVAILABLE:
            print(f"{label}: {progress:.1%}")
            return True
        
        try:
            start_time = time.perf_counter()
            
            # Create progress bar
            with Progress(
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                console=self._console
            ) as progress_bar:
                task = progress_bar.add_task(label, total=100)
                progress_bar.update(task, completed=progress * 100)
            
            # Check budget
            render_time_ms = (time.perf_counter() - start_time) * 1000
            return render_time_ms <= self._budget.max_render_time_ms
            
        except Exception:
            return False
    
    def clear(self) -> None:
        """Clear the HUD display"""
        if self._console:
            self._console.clear()
        else:
            print("\n" * 10)  # Simple clear for fallback
    
    def get_budget_compliance(self) -> float:
        """
        Get budget compliance ratio
        
        Returns:
            Compliance ratio (1.0 = perfect, 0.0 = always over budget)
        """
        if self._metrics.update_count == 0:
            return 1.0
        
        compliant_updates = self._metrics.update_count - self._metrics.budget_violations
        return compliant_updates / self._metrics.update_count