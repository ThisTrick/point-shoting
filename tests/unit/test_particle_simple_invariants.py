"""Simple property-based tests for particle positions"""

import pytest
import numpy as np
from hypothesis import given, strategies as st, settings


class TestParticlePositionSimple:
    """Simple property-based tests for particle position invariants"""
    
    @given(
        particle_count=st.integers(min_value=5, max_value=100)
    )
    @settings(max_examples=10, deadline=3000)
    def test_position_array_creation(self, particle_count):
        """Test that particle position arrays can be created with valid bounds"""
        # Create position array
        positions = np.random.uniform(0.0, 1.0, size=(particle_count, 2)).astype(np.float32)
        
        # Test bounds
        assert np.all(positions >= 0.0), "Some positions below 0"
        assert np.all(positions <= 1.0), "Some positions above 1" 
        assert positions.shape == (particle_count, 2), f"Wrong shape: {positions.shape}"
        assert positions.dtype == np.float32, f"Wrong dtype: {positions.dtype}"
    
    @given(
        positions_data=st.lists(
            st.tuples(
                st.floats(min_value=-2.0, max_value=3.0, allow_nan=False),
                st.floats(min_value=-2.0, max_value=3.0, allow_nan=False)
            ),
            min_size=5,
            max_size=50
        )
    )
    @settings(max_examples=15, deadline=3000)
    def test_position_clamping(self, positions_data):
        """Test position clamping to bounds"""
        # Convert to numpy array
        positions = np.array(positions_data, dtype=np.float32)
        
        # Store original for comparison
        original = positions.copy()
        
        # Clamp positions
        np.clip(positions, 0.0, 1.0, out=positions)
        
        # Test clamping worked
        assert np.all(positions >= 0.0), "Some positions still below 0 after clamping"
        assert np.all(positions <= 1.0), "Some positions still above 1 after clamping"
        
        # Test that already valid positions unchanged
        for i in range(len(positions)):
            for j in range(2):
                if 0.0 <= original[i, j] <= 1.0:
                    assert abs(positions[i, j] - original[i, j]) < 1e-6, \
                        f"Valid position changed: {positions[i, j]} != {original[i, j]}"
    
    @given(
        velocity_data=st.lists(
            st.tuples(
                st.floats(min_value=-50.0, max_value=50.0, allow_nan=False),
                st.floats(min_value=-50.0, max_value=50.0, allow_nan=False)
            ),
            min_size=5,
            max_size=30
        ),
        max_velocity=st.floats(min_value=0.1, max_value=20.0)
    )
    @settings(max_examples=15, deadline=3000)
    def test_velocity_magnitude_clamping(self, velocity_data, max_velocity):
        """Test velocity magnitude clamping"""
        velocities = np.array(velocity_data, dtype=np.float32)
        
        # Calculate original magnitudes
        original_magnitudes = np.linalg.norm(velocities, axis=1)
        
        # Clamp velocities to max magnitude
        for i in range(len(velocities)):
            magnitude = np.linalg.norm(velocities[i])
            if magnitude > max_velocity:
                velocities[i] = velocities[i] / magnitude * max_velocity
        
        # Test clamping worked - use more tolerant epsilon for float32
        new_magnitudes = np.linalg.norm(velocities, axis=1)
        tolerance = max(1e-4, max_velocity * 1e-5)  # Adaptive tolerance based on magnitude
        assert np.all(new_magnitudes <= max_velocity + tolerance), \
            f"Some velocities exceed max: {np.max(new_magnitudes)} > {max_velocity}"
        
        # Test direction preservation for clamped velocities
        for i in range(len(velocities)):
            if original_magnitudes[i] > max_velocity and original_magnitudes[i] > 1e-6:
                # This should be clamped to exactly max_velocity
                expected_magnitude = max_velocity
                actual_magnitude = new_magnitudes[i]
                assert abs(actual_magnitude - expected_magnitude) < 1e-3, \
                    f"Clamped magnitude incorrect: {actual_magnitude} != {expected_magnitude}"
    
    @given(
        array_size=st.integers(min_value=10, max_value=100),
        damping_factor=st.floats(min_value=0.0, max_value=1.0)
    )
    @settings(max_examples=10, deadline=2000)  
    def test_velocity_damping_properties(self, array_size, damping_factor):
        """Test velocity damping preserves direction and scales magnitude"""
        # Create random velocities
        velocities = np.random.uniform(-10.0, 10.0, size=(array_size, 2)).astype(np.float32)
        original = velocities.copy()
        original_magnitudes = np.linalg.norm(original, axis=1)
        
        # Apply damping
        velocities *= damping_factor
        new_magnitudes = np.linalg.norm(velocities, axis=1)
        
        # Test magnitude scaling
        expected_magnitudes = original_magnitudes * damping_factor
        magnitude_diffs = np.abs(new_magnitudes - expected_magnitudes)
        assert np.all(magnitude_diffs < 1e-5), \
            f"Damping magnitude incorrect, max diff: {np.max(magnitude_diffs)}"
        
        # Test direction preservation (for non-zero velocities)
        for i in range(array_size):
            if original_magnitudes[i] > 1e-6 and new_magnitudes[i] > 1e-6:
                original_dir = original[i] / original_magnitudes[i]
                new_dir = velocities[i] / new_magnitudes[i]
                direction_diff = np.linalg.norm(new_dir - original_dir)
                assert direction_diff < 1e-3, \
                    f"Direction changed during damping: {direction_diff}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
