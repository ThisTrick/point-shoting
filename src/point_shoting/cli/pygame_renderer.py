"""Pygame-based visual renderer for particle animation"""

import numpy as np

try:
    import pygame

    PYGAME_AVAILABLE = True
except ImportError:
    PYGAME_AVAILABLE = False

from ..models.particle_arrays import ParticleArrays


class PygameRenderer:
    """Renders particles to a pygame window"""

    def __init__(
        self,
        width: int = 800,
        height: int = 800,
        bg_color: tuple[int, int, int] = (0, 0, 0),
    ) -> None:
        if not PYGAME_AVAILABLE:
            raise RuntimeError("pygame is required for visual rendering: pip install pygame")

        self._width = width
        self._height = height
        self._bg_color = bg_color
        self._dot_radius = 2

        pygame.init()
        self._screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption("Point Shoting")
        self._clock = pygame.time.Clock()
        self._font = pygame.font.SysFont("monospace", 16)
        self._running = True

    def render_frame(
        self,
        snapshot: ParticleArrays,
        stage_name: str = "",
        fps: float = 0.0,
        recognition: float = 0.0,
    ) -> None:
        """Draw all particles for one frame using vectorized surfarray rendering"""
        # Create a fresh surface for particle drawing
        particle_surf = pygame.Surface((self._width, self._height))
        particle_surf.fill(self._bg_color)
        pixel_array = pygame.surfarray.pixels3d(particle_surf)

        # Convert normalized [0,1] positions to pixel coordinates
        px = (snapshot.position[:, 0] * (self._width - 1)).astype(np.int32)
        py = (snapshot.position[:, 1] * (self._height - 1)).astype(np.int32)
        colors_rgb = snapshot.color_rgba[:, :3]

        # Filter active particles
        active = snapshot.active
        if not np.all(active):
            px = px[active]
            py = py[active]
            colors_rgb = colors_rgb[active]

        # Clamp to screen bounds (leaving 1px margin for 3x3 dot)
        np.clip(px, 1, self._width - 2, out=px)
        np.clip(py, 1, self._height - 2, out=py)

        # Draw 3x3 pixel dots using vectorized surfarray writes
        # This is ~60x faster than pygame.draw.circle loop
        for dy in range(-1, 2):
            for dx in range(-1, 2):
                pixel_array[px + dx, py + dy] = colors_rgb

        # Release surface lock before blit
        del pixel_array

        self._screen.blit(particle_surf, (0, 0))

        # HUD overlay
        if stage_name:
            hud_lines = [
                f"Stage: {stage_name}",
                f"FPS: {fps:.0f}",
                f"Recognition: {recognition:.2f}",
                f"Particles: {len(px)}",
                "",
                "SPACE=pause  S=skip  ESC=quit",
            ]
            y_offset = 10
            for line in hud_lines:
                text_surface = self._font.render(line, True, (200, 200, 200))
                self._screen.blit(text_surface, (10, y_offset))
                y_offset += 20

        pygame.display.flip()

    def handle_events(self) -> dict[str, bool]:
        """Process pygame events and return action flags"""
        actions = {
            "quit": False,
            "toggle_pause": False,
            "skip": False,
        }
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                actions["quit"] = True
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    actions["quit"] = True
                elif event.key == pygame.K_SPACE:
                    actions["toggle_pause"] = True
                elif event.key == pygame.K_s:
                    actions["skip"] = True
        return actions

    def tick(self, max_fps: int = 60) -> None:
        """Limit frame rate"""
        self._clock.tick(max_fps)

    def cleanup(self) -> None:
        """Clean up pygame resources"""
        pygame.quit()
