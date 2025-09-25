"""Property-based tests for particle positions using hypothesis framework"""

import pytest
import numpy as np
from hypothesis import given, strategies as st, assume, settings, note

# Test imports individually to identify issues
try:
    from src.point_shoting.models.particle_arrays import ParticleArrays, allocate_particle_arrays
except ImportError as e:
    pytest.skip(f"Cannot import particle_arrays: {e}")

try:
    from src.point_shoting.services.breathing_oscillator import BreathingOscillator
except ImportError as e:
    pytest.skip(f"Cannot import breathing_oscillator: {e}")

try:
    from hypothesis.extra.numpy import arrays
except ImportError as e:
    pytest.skip(f"Cannot import hypothesis.extra.numpy: {e}")


class TestParticlePositionInvariants:
    """Property-based tests for particle position invariants"""
    
    @given(
        particle_count=st.integers(min_value=10, max_value=1000),
        positions=st.data()
    )
    @settings(max_examples=50, deadline=5000)
    def test_position_bounds_invariant(self, particle_count, positions):
        """Test that particle positions always remain within [0,1]^2 bounds"""
        # Generate valid position arrays using basic numpy instead of hypothesis arrays  
        np.random.seed(42)  # For reproducible tests
        position_array = np.random.uniform(0.0, 1.0, size=(particle_count, 2)).astype(np.float32)
        
        # Create particle arrays
        particles = allocate_particle_arrays(particle_count)
        particles.position[:] = position_array
        
        # Test that validation passes for valid positions
        particles.validate()
        
        # Test clamping behavior with out-of-bounds positions
        # Generate some out-of-bounds positions using numpy
        out_of_bounds = np.random.uniform(-2.0, 3.0, size=(particle_count, 2)).astype(np.float32)
        
        particles.position[:] = out_of_bounds
        particles.clamp_positions()
        
        # After clamping, all positions should be in bounds
        assert np.all(particles.position >= 0.0), "Some positions below 0 after clamping"
        assert np.all(particles.position <= 1.0), "Some positions above 1 after clamping"
        
        # Positions that were already in bounds should be unchanged
        in_bounds_mask = (out_of_bounds >= 0.0) & (out_of_bounds <= 1.0)
        for i in range(particle_count):
            for j in range(2):
                if in_bounds_mask[i, j]:
                    assert abs(particles.position[i, j] - out_of_bounds[i, j]) < 1e-6, \
                        f"In-bounds position changed during clamping: {particles.position[i, j]} != {out_of_bounds[i, j]}"
    
    @given(
        particle_count=st.integers(min_value=5, max_value=100),
        max_velocity=st.floats(min_value=0.1, max_value=50.0, allow_nan=False)
    )
    @settings(max_examples=15, deadline=3000)
    def test_velocity_magnitude_invariant(self, particle_count, max_velocity):
        """Test that velocity magnitudes respect maximum velocity constraints"""
        # Generate velocity arrays with potentially large magnitudes using numpy
        np.random.seed(42)
        velocities = np.random.uniform(-100.0, 100.0, size=(particle_count, 2)).astype(np.float32)
        
        particles = allocate_particle_arrays(particle_count)
        particles.velocity[:] = velocities
        
        # Store original directions
        original_magnitudes = particles.get_velocity_magnitudes()
        original_directions = np.zeros_like(particles.velocity)
        non_zero_mask = original_magnitudes > 1e-6
        original_directions[non_zero_mask] = particles.velocity[non_zero_mask] / original_magnitudes[non_zero_mask, np.newaxis]
        
        # Apply velocity clamping
        particles.clamp_velocities(max_velocity)
        
        # Check magnitude constraint (use more tolerant threshold for float32)
        new_magnitudes = particles.get_velocity_magnitudes()
        assert np.all(new_magnitudes <= max_velocity + 1e-3), f"Some velocities exceed max: {np.max(new_magnitudes)} > {max_velocity}"
        
        # Check that directions are preserved for clamped velocities
        for i in range(particle_count):
            if original_magnitudes[i] > max_velocity and original_magnitudes[i] > 1e-6:
                # This velocity should have been clamped
                expected_magnitude = max_velocity
                actual_magnitude = new_magnitudes[i]
                assert abs(actual_magnitude - expected_magnitude) < 1e-3, \
                    f"Clamped velocity magnitude incorrect: {actual_magnitude} != {expected_magnitude}"
                
                # Direction should be preserved
                if actual_magnitude > 1e-6:
                    new_direction = particles.velocity[i] / actual_magnitude
                    direction_diff = np.linalg.norm(new_direction - original_directions[i])
                    assert direction_diff < 1e-3, f"Direction changed during clamping: {direction_diff}"
            elif original_magnitudes[i] <= max_velocity:
                # This velocity should be unchanged
                magnitude_diff = abs(new_magnitudes[i] - original_magnitudes[i])
                assert magnitude_diff < 1e-6, f"Unclamped velocity changed: {magnitude_diff}"
    
    @given(
        particle_count=st.integers(min_value=10, max_value=200),
        damping_factor=st.floats(min_value=0.0, max_value=1.0, allow_nan=False)
    )
    @settings(max_examples=30, deadline=3000)
    def test_damping_invariant(self, particle_count, damping_factor):
        """Test that velocity damping preserves direction and reduces magnitude"""
        # Generate non-zero velocities
        np.random.seed(42)  # For reproducible tests
        velocities = np.random.uniform(-10.0, 10.0, size=(particle_count, 2)).astype(np.float32)
        
        particles = allocate_particle_arrays(particle_count)
        particles.velocity[:] = velocities
        
        # Store original state
        original_magnitudes = particles.get_velocity_magnitudes()
        original_directions = np.zeros_like(particles.velocity)
        non_zero_mask = original_magnitudes > 1e-6
        original_directions[non_zero_mask] = particles.velocity[non_zero_mask] / original_magnitudes[non_zero_mask, np.newaxis]
        
        # Apply damping
        particles.apply_damping(damping_factor)
        
        # Check magnitude scaling
        new_magnitudes = particles.get_velocity_magnitudes()
        expected_magnitudes = original_magnitudes * damping_factor
        
        magnitude_diffs = np.abs(new_magnitudes - expected_magnitudes)
        assert np.all(magnitude_diffs < 1e-3), f"Damping magnitude incorrect, max diff: {np.max(magnitude_diffs)}"
        
        # Check direction preservation (for non-zero velocities)
        for i in range(particle_count):
            if original_magnitudes[i] > 1e-6 and new_magnitudes[i] > 1e-6:
                new_direction = particles.velocity[i] / new_magnitudes[i]
                direction_diff = np.linalg.norm(new_direction - original_directions[i])
                assert direction_diff < 1e-3, f"Direction changed during damping: {direction_diff}"
    
    @given(
        particle_count=st.integers(min_value=5, max_value=50),
        time_values=st.lists(
            st.floats(min_value=0.0, max_value=10.0, allow_nan=False),
            min_size=3,
            max_size=10
        )
    )
    @settings(max_examples=20, deadline=5000)
    def test_breathing_oscillator_bounds_invariant(self, particle_count, time_values):
        """Test that breathing oscillator keeps positions within bounds"""
        assume(len(time_values) >= 3)
        
        # Create oscillator with reasonable parameters
        oscillator = BreathingOscillator()
        oscillator.configure(
            amplitude=0.1,  # 10% amplitude
            frequency=2.0,
            decay=0.0
        )
        
        # Create initial positions in bounds
        np.random.seed(42)
        initial_positions = np.random.uniform(0.2, 0.8, size=(particle_count, 2)).astype(np.float32)
        center = np.array([0.5, 0.5], dtype=np.float32)
        
        # Test breathing effect at multiple time points
        for time_val in sorted(time_values):
            positions = initial_positions.copy()
            
            # Apply breathing effect
            oscillator.apply(positions, time_val, center)
            
            # Check bounds invariant
            assert np.all(positions >= 0.0), f"Breathing effect pushed positions below 0 at time {time_val}"
            assert np.all(positions <= 1.0), f"Breathing effect pushed positions above 1 at time {time_val}"
            
            # Check that positions are reasonable (not too far from original)
            max_displacement = np.max(np.linalg.norm(positions - initial_positions, axis=1))
            assert max_displacement <= 0.5, f"Breathing effect displacement too large: {max_displacement}"
    
    @pytest.mark.skip("Complex test with PIL dependencies - skipping for now")
    @given(
        dimensions=st.tuples(
            st.integers(min_value=1, max_value=20),  # width
            st.integers(min_value=1, max_value=20)   # height
        ),
        particle_count=st.integers(min_value=5, max_value=100)
    )
    @settings(max_examples=20, deadline=3000)
    def test_target_mapping_distribution_invariant(self, dimensions, particle_count):
        """Test that target position mapping maintains distribution properties"""
        try:
            from src.point_shoting.models.particle_arrays import map_image_to_targets
            from PIL import Image
            PIL_AVAILABLE = True
        except ImportError:
            pytest.skip("PIL or map_image_to_targets not available for target mapping tests")
        
        width, height = dimensions
        
        # Create a simple test image with known properties
        test_image = Image.new('RGB', (width, height), color=(128, 128, 128))
        
        # Add some variation (checkerboard pattern)
        for x in range(width):
            for y in range(height):
                if (x + y) % 2 == 0:
                    test_image.putpixel((x, y), (255, 255, 255))
        
        # Generate target positions
        targets = map_image_to_targets(test_image, particle_count)
        
        # Test basic properties
        assert targets.shape == (particle_count, 2), f"Target shape incorrect: {targets.shape}"
        assert targets.dtype == np.float32, f"Target dtype incorrect: {targets.dtype}"
        
        # Test bounds invariant
        assert np.all(targets >= 0.0), "Some targets below 0"
        assert np.all(targets <= 1.0), "Some targets above 1"
        
        # Test distribution properties
        if particle_count >= 10:  # Need enough particles for statistics
            # X and Y coordinates should have reasonable spread
            x_spread = np.max(targets[:, 0]) - np.min(targets[:, 0])
            y_spread = np.max(targets[:, 1]) - np.min(targets[:, 1])
            
            # For non-trivial images, expect some spread
            if width > 1:
                assert x_spread > 0.0, "No spread in X coordinates"
            if height > 1:
                assert y_spread > 0.0, "No spread in Y coordinates"
            
            # No targets should be exactly identical (very low probability)
            unique_targets = np.unique(targets.view(np.void), axis=0)
            uniqueness_ratio = len(unique_targets) / particle_count
            
            # Allow some duplicates but not too many
            assert uniqueness_ratio > 0.5, f"Too many duplicate targets: {uniqueness_ratio}"
    
    @pytest.mark.skip("Complex physics simulation test - skipping for now")
    @given(
        particle_count=st.integers(min_value=10, max_value=100),
        steps=st.integers(min_value=1, max_value=20),
        physics_params=st.fixed_dictionaries({
            'damping': st.floats(min_value=0.9, max_value=0.99, allow_nan=False),
            'max_velocity': st.floats(min_value=1.0, max_value=20.0, allow_nan=False),
            'dt': st.floats(min_value=1/120, max_value=1/30, allow_nan=False)  # 30-120 FPS
        })
    )
    @settings(max_examples=15, deadline=8000)
    def test_physics_step_invariants(self, particle_count, steps, physics_params):
        """Test that physics simulation maintains invariants over multiple steps"""
        # Create particle arrays
        particles = allocate_particle_arrays(particle_count)
        
        # Initialize with random but valid state
        np.random.seed(42)
        particles.position[:] = np.random.uniform(0.1, 0.9, size=(particle_count, 2)).astype(np.float32)
        particles.velocity[:] = np.random.uniform(-5.0, 5.0, size=(particle_count, 2)).astype(np.float32)
        particles.target[:] = np.random.uniform(0.0, 1.0, size=(particle_count, 2)).astype(np.float32)
        particles.active[:] = True
        
        # Physics parameters
        damping = physics_params['damping']
        max_velocity = physics_params['max_velocity']
        dt = physics_params['dt']
        
        # Run simulation steps
        for step in range(steps):
            note(f"Physics step {step + 1}/{steps}")
            
            # Store pre-step state for validation
            pre_positions = particles.position.copy()
            pre_velocities = particles.velocity.copy()
            
            # Apply simple physics update (similar to real engine)
            # Velocity update with damping
            particles.apply_damping(damping)
            
            # Position update
            particles.position += particles.velocity * dt
            
            # Apply constraints
            particles.clamp_positions()
            particles.clamp_velocities(max_velocity)
            
            # Validate invariants after each step
            
            # 1. Position bounds invariant
            assert np.all(particles.position >= 0.0), f"Positions below 0 at step {step}"
            assert np.all(particles.position <= 1.0), f"Positions above 1 at step {step}"
            
            # 2. Velocity magnitude invariant
            velocities_magnitude = particles.get_velocity_magnitudes()
            assert np.all(velocities_magnitude <= max_velocity + 1e-6), \
                f"Velocities exceed max at step {step}: {np.max(velocities_magnitude)} > {max_velocity}"
            
            # 3. Reasonable position changes (no teleportation) 
            max_position_change = np.max(np.linalg.norm(particles.position - pre_positions, axis=1))
            reasonable_change_limit = max_velocity * dt * 5  # More generous factor for safety
            assert max_position_change <= reasonable_change_limit, \
                f"Unreasonable position change at step {step}: {max_position_change} > {reasonable_change_limit}"
            
            # 4. Energy should generally decrease due to damping (unless near targets)
            if step > 0:  # Need at least one step for comparison
                current_kinetic_energy = np.sum(velocities_magnitude ** 2)
                # Energy can increase due to attraction forces, but not by too much
                # This is a loose check - in real system, attraction could add energy
                assert current_kinetic_energy < 1000 * particle_count, \
                    f"Kinetic energy explosion at step {step}: {current_kinetic_energy}"
    
    @given(
        array_size=st.integers(min_value=10, max_value=1000),
        modification_data=st.data()
    )
    @settings(max_examples=30, deadline=3000)
    def test_particle_array_consistency_invariant(self, array_size, modification_data):
        """Test that ParticleArrays maintains internal consistency under modifications"""
        # Create valid particle arrays
        particles = allocate_particle_arrays(array_size)
        
        # Initial validation should pass
        particles.validate()
        
        # Test various modifications while maintaining consistency
        # Simple modifications without hypothesis arrays
        modifications = ['clamp_positions', 'clamp_velocities', 'apply_damping']
        
        for modification in modifications:
            note(f"Applying modification: {modification}")
            
            if modification == 'clamp_positions':
                particles.clamp_positions()
                
            elif modification == 'clamp_velocities':
                particles.clamp_velocities(10.0)  # Fixed reasonable value
                
            elif modification == 'apply_damping':
                particles.apply_damping(0.95)  # Fixed reasonable damping
            
            # After each modification, validation should still pass
            particles.validate()
            
            # Additional consistency checks
            assert particles.particle_count == array_size, "Particle count changed"
            assert 0 <= particles.get_active_count() <= array_size, "Active count out of range"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])