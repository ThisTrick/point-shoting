"""Watermark rendering service with PNG validation and placement control"""

from typing import Dict, Any, Optional, Tuple, Union, List
from dataclasses import dataclass
from enum import Enum
import os
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False


class WatermarkPosition(Enum):
    """Watermark positioning options"""
    TOP_LEFT = "top_left"
    TOP_RIGHT = "top_right"
    BOTTOM_LEFT = "bottom_left"
    BOTTOM_RIGHT = "bottom_right"
    CENTER = "center"
    CUSTOM = "custom"


@dataclass
class WatermarkConfig:
    """Configuration for watermark rendering"""
    opacity: float = 0.7            # Watermark opacity (0-1)
    scale: float = 1.0              # Scale factor for watermark size
    position: WatermarkPosition = WatermarkPosition.BOTTOM_RIGHT
    custom_x: float = 0.0           # Custom X position (0-1) for CUSTOM position
    custom_y: float = 0.0           # Custom Y position (0-1) for CUSTOM position
    margin_px: int = 20             # Margin from edges in pixels
    

class WatermarkRenderer:
    """Renders watermarks with PNG validation and flexible positioning"""
    
    def __init__(self):
        """Initialize watermark renderer"""
        self._config = WatermarkConfig()
        self._watermark_image: Optional[Image.Image] = None
        self._text_watermark: Optional[str] = None
        self._font_path: Optional[str] = None
        self._font_size: int = 24
        self._validation_errors: List[str] = []
        
    def load_png_watermark(self, png_path: Union[str, Path]) -> bool:
        """
        Load and validate PNG watermark image
        
        Args:
            png_path: Path to PNG watermark file
            
        Returns:
            True if PNG loaded and validated successfully
        """
        if not PIL_AVAILABLE:
            self._validation_errors.append("PIL/Pillow not available for PNG processing")
            return False
        
        try:
            png_path = Path(png_path)
            
            # Validate file exists
            if not png_path.exists():
                self._validation_errors.append(f"PNG file not found: {png_path}")
                return False
            
            # Validate file extension
            if png_path.suffix.lower() != '.png':
                self._validation_errors.append(f"File is not a PNG: {png_path}")
                return False
            
            # Load and validate PNG
            image = Image.open(png_path)
            
            # Validate PNG format
            if image.format != 'PNG':
                self._validation_errors.append(f"File format is {image.format}, expected PNG")
                return False
            
            # Validate image properties
            if image.size[0] == 0 or image.size[1] == 0:
                self._validation_errors.append("PNG has zero dimensions")
                return False
            
            # Ensure RGBA mode for transparency support
            if image.mode != 'RGBA':
                image = image.convert('RGBA')
            
            self._watermark_image = image
            self._text_watermark = None  # Clear text watermark
            self._validation_errors.clear()
            
            return True
            
        except Exception as e:
            self._validation_errors.append(f"Error loading PNG: {str(e)}")
            return False
    
    def set_text_watermark(
        self, 
        text: str, 
        font_path: Optional[str] = None, 
        font_size: int = 24
    ) -> bool:
        """
        Set text-based watermark
        
        Args:
            text: Watermark text
            font_path: Optional path to font file
            font_size: Font size in pixels
            
        Returns:
            True if text watermark set successfully
        """
        if not text.strip():
            self._validation_errors.append("Watermark text cannot be empty")
            return False
        
        self._text_watermark = text.strip()
        self._font_path = font_path
        self._font_size = font_size
        self._watermark_image = None  # Clear PNG watermark
        self._validation_errors.clear()
        
        return True
    
    def configure(
        self,
        opacity: float = 0.7,
        scale: float = 1.0,
        position: WatermarkPosition = WatermarkPosition.BOTTOM_RIGHT,
        custom_x: float = 0.0,
        custom_y: float = 0.0,
        margin_px: int = 20
    ) -> None:
        """
        Configure watermark rendering parameters
        
        Args:
            opacity: Watermark opacity (0-1)
            scale: Scale factor for watermark size
            position: Watermark position
            custom_x: Custom X position (0-1) for CUSTOM position
            custom_y: Custom Y position (0-1) for CUSTOM position  
            margin_px: Margin from edges in pixels
        """
        self._config = WatermarkConfig(
            opacity=max(0.0, min(1.0, opacity)),  # Clamp to [0,1]
            scale=max(0.1, min(5.0, scale)),      # Reasonable scale limits
            position=position,
            custom_x=max(0.0, min(1.0, custom_x)), # Clamp to [0,1]
            custom_y=max(0.0, min(1.0, custom_y)), # Clamp to [0,1]
            margin_px=max(0, margin_px)
        )
    
    def render_on_image(self, target_image: Image.Image) -> Image.Image:
        """
        Render watermark on target image
        
        Args:
            target_image: Target image to watermark
            
        Returns:
            New image with watermark applied
        """
        if not PIL_AVAILABLE:
            return target_image.copy()
        
        if not self._watermark_image and not self._text_watermark:
            return target_image.copy()
        
        # Create copy to avoid modifying original
        result = target_image.copy().convert('RGBA')
        
        if self._watermark_image:
            result = self._apply_png_watermark(result)
        elif self._text_watermark:
            result = self._apply_text_watermark(result)
        
        return result.convert(target_image.mode)
    
    def _apply_png_watermark(self, target: Image.Image) -> Image.Image:
        """Apply PNG watermark to target image"""
        watermark = self._watermark_image.copy()
        
        # Apply scaling
        if self._config.scale != 1.0:
            new_size = (
                int(watermark.size[0] * self._config.scale),
                int(watermark.size[1] * self._config.scale)
            )
            watermark = watermark.resize(new_size, Image.Resampling.LANCZOS)
        
        # Apply opacity
        if self._config.opacity < 1.0:
            # Adjust alpha channel
            alpha = watermark.split()[-1]  # Get alpha channel
            alpha = alpha.point(lambda p: int(p * self._config.opacity))
            watermark.putalpha(alpha)
        
        # Calculate position
        pos_x, pos_y = self._calculate_position(target.size, watermark.size)
        
        # Create watermark layer
        watermark_layer = Image.new('RGBA', target.size, (0, 0, 0, 0))
        watermark_layer.paste(watermark, (pos_x, pos_y), watermark)
        
        # Composite with target
        result = Image.alpha_composite(target, watermark_layer)
        
        return result
    
    def _apply_text_watermark(self, target: Image.Image) -> Image.Image:
        """Apply text watermark to target image"""
        # Create drawing context
        draw = ImageDraw.Draw(target)
        
        # Load font
        try:
            if self._font_path and os.path.exists(self._font_path):
                font = ImageFont.truetype(self._font_path, self._font_size)
            else:
                # Try to load default font
                font = ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()
        
        # Get text dimensions
        bbox = draw.textbbox((0, 0), self._text_watermark, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Calculate position
        pos_x, pos_y = self._calculate_position(target.size, (text_width, text_height))
        
        # Calculate text color with opacity
        opacity_int = int(255 * self._config.opacity)
        text_color = (255, 255, 255, opacity_int)  # White with opacity
        
        # Draw text
        draw.text((pos_x, pos_y), self._text_watermark, font=font, fill=text_color)
        
        return target
    
    def _calculate_position(self, target_size: Tuple[int, int], watermark_size: Tuple[int, int]) -> Tuple[int, int]:
        """Calculate watermark position based on configuration"""
        target_width, target_height = target_size
        watermark_width, watermark_height = watermark_size
        margin = self._config.margin_px
        
        if self._config.position == WatermarkPosition.TOP_LEFT:
            return (margin, margin)
        elif self._config.position == WatermarkPosition.TOP_RIGHT:
            return (target_width - watermark_width - margin, margin)
        elif self._config.position == WatermarkPosition.BOTTOM_LEFT:
            return (margin, target_height - watermark_height - margin)
        elif self._config.position == WatermarkPosition.BOTTOM_RIGHT:
            return (target_width - watermark_width - margin, target_height - watermark_height - margin)
        elif self._config.position == WatermarkPosition.CENTER:
            return (
                (target_width - watermark_width) // 2,
                (target_height - watermark_height) // 2
            )
        elif self._config.position == WatermarkPosition.CUSTOM:
            return (
                int(self._config.custom_x * (target_width - watermark_width)),
                int(self._config.custom_y * (target_height - watermark_height))
            )
        else:
            # Default to bottom right
            return (target_width - watermark_width - margin, target_height - watermark_height - margin)
    
    def validate_png(self, png_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Validate PNG file without loading
        
        Args:
            png_path: Path to PNG file
            
        Returns:
            Validation results dictionary
        """
        validation_result = {
            "valid": False,
            "errors": [],
            "warnings": [],
            "info": {}
        }
        
        if not PIL_AVAILABLE:
            validation_result["errors"].append("PIL/Pillow not available")
            return validation_result
        
        try:
            png_path = Path(png_path)
            
            # Check file existence
            if not png_path.exists():
                validation_result["errors"].append(f"File not found: {png_path}")
                return validation_result
            
            # Check file extension
            if png_path.suffix.lower() != '.png':
                validation_result["warnings"].append(f"File extension is {png_path.suffix}, expected .png")
            
            # Try to open and get basic info
            with Image.open(png_path) as img:
                # Check format
                if img.format != 'PNG':
                    validation_result["errors"].append(f"Format is {img.format}, expected PNG")
                    return validation_result
                
                # Get image info
                validation_result["info"] = {
                    "format": img.format,
                    "mode": img.mode,
                    "size": img.size,
                    "file_size_bytes": png_path.stat().st_size
                }
                
                # Check dimensions
                if img.size[0] == 0 or img.size[1] == 0:
                    validation_result["errors"].append("Image has zero dimensions")
                    return validation_result
                
                # Check if transparency is supported
                if img.mode not in ('RGBA', 'LA', 'P'):
                    validation_result["warnings"].append(f"Mode {img.mode} may not support transparency")
                
                # File size warnings
                file_size_mb = png_path.stat().st_size / (1024 * 1024)
                if file_size_mb > 10:
                    validation_result["warnings"].append(f"Large file size: {file_size_mb:.1f}MB")
                
                validation_result["valid"] = True
                
        except Exception as e:
            validation_result["errors"].append(f"Error validating PNG: {str(e)}")
        
        return validation_result
    
    def get_watermark_info(self) -> Dict[str, Any]:
        """Get information about current watermark"""
        info = {
            "type": None,
            "config": {
                "opacity": self._config.opacity,
                "scale": self._config.scale,
                "position": self._config.position.value,
                "margin_px": self._config.margin_px
            },
            "validation_errors": self._validation_errors.copy()
        }
        
        if self._watermark_image:
            info["type"] = "png"
            info["png_info"] = {
                "size": self._watermark_image.size,
                "mode": self._watermark_image.mode,
                "format": self._watermark_image.format
            }
        elif self._text_watermark:
            info["type"] = "text"
            info["text_info"] = {
                "text": self._text_watermark,
                "font_path": self._font_path,
                "font_size": self._font_size
            }
        
        return info
    
    def has_watermark(self) -> bool:
        """Check if watermark is configured"""
        return self._watermark_image is not None or self._text_watermark is not None
    
    def clear_watermark(self) -> None:
        """Clear current watermark"""
        self._watermark_image = None
        self._text_watermark = None
        self._font_path = None
        self._validation_errors.clear()
    
    def preview_position(self, target_size: Tuple[int, int], watermark_size: Tuple[int, int]) -> Tuple[int, int]:
        """
        Preview where watermark would be positioned
        
        Args:
            target_size: Target image size (width, height)
            watermark_size: Watermark size (width, height)
            
        Returns:
            Calculated position (x, y)
        """
        return self._calculate_position(target_size, watermark_size)
    
    def batch_apply_watermark(self, images: List[Image.Image]) -> List[Image.Image]:
        """
        Apply watermark to batch of images
        
        Args:
            images: List of images to watermark
            
        Returns:
            List of watermarked images
        """
        if not self.has_watermark():
            return [img.copy() for img in images]
        
        return [self.render_on_image(img) for img in images]
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            "pil_available": PIL_AVAILABLE,
            "has_watermark": self.has_watermark(),
            "watermark_type": "png" if self._watermark_image else "text" if self._text_watermark else None,
            "validation_errors_count": len(self._validation_errors)
        }
