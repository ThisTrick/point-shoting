"""
Pytest configuration to ensure the project root is importable.

Some environments (including certain isolated runners) may start pytest with
an unexpected sys.path[0]. We explicitly add the repository root so that
`import src...` works reliably for tests that reference the source layout.
"""

from __future__ import annotations

import os
import sys


def _add_repo_root_to_syspath() -> None:
    # Repo root is the directory containing this file's parent directory (tests/)
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)


_add_repo_root_to_syspath()


import pytest
import numpy as np
from unittest.mock import Mock, patch


@pytest.fixture
def mock_pil_image():
    """Create a mock PIL Image that works properly with numpy.array()"""
    def _create_mock_image(width=100, height=100, mode='RGB'):
        mock_img = Mock()
        mock_img.size = (width, height)
        mock_img.mode = mode
        mock_img.convert.return_value = mock_img
        mock_img.resize.return_value = mock_img
        
        # Create a numpy array that represents the image
        if mode == 'RGB':
            channels = 3
        elif mode == 'RGBA':
            channels = 4
        else:
            channels = 1
            
        # Create fake image data
        image_array = np.random.randint(0, 255, (height, width, channels), dtype=np.uint8)
        
        # Mock __array__ method so np.array(mock_img) works
        mock_img.__array__ = lambda: image_array
        
        return mock_img, image_array
    
    return _create_mock_image
