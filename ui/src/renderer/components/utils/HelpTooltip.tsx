/**
 * HelpTooltip Component
 * 
 * Rich tooltip system with:
 * - Multiple trigger types (hover, click, focus)
 * - Smart positioning with collision detection
 * - Rich content support (text, HTML, React components)
 * - Accessibility with ARIA attributes and keyboard navigation
 * - Portal rendering to avoid z-index issues
 * - Animation system with multiple transition types
 * - Delay management for better UX
 * - Interactive content support with hover handling
 * - Theme variants and styling customization
 * - Mobile-friendly touch interactions
 * 
 * Used throughout the UI for contextual help,
 * feature explanations, and interactive guides.
 */

import React, { useState, useRef, useEffect, useCallback, cloneElement } from 'react';
import { createPortal } from 'react-dom';
import './HelpTooltip.css';

export type TooltipTrigger = 'hover' | 'click' | 'focus' | 'manual';
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';
export type TooltipTheme = 'dark' | 'light' | 'primary' | 'error' | 'warning' | 'success';
export type TooltipAnimation = 'fade' | 'slide' | 'scale' | 'none';

export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  
  // Positioning
  position?: TooltipPosition;
  offset?: number;
  arrow?: boolean;
  
  // Behavior
  trigger?: TooltipTrigger | TooltipTrigger[];
  delay?: number | { show: number; hide: number };
  disabled?: boolean;
  interactive?: boolean; // Allow hovering over tooltip content
  
  // Styling
  theme?: TooltipTheme;
  animation?: TooltipAnimation;
  maxWidth?: number | string;
  className?: string;
  
  // Accessibility
  id?: string;
  role?: string;
  
  // Events
  onShow?: () => void;
  onHide?: () => void;
  onToggle?: (visible: boolean) => void;
}

interface TooltipState {
  isVisible: boolean;
  position: { top: number; left: number };
  computedPosition: TooltipPosition;
  arrow: { top?: number; left?: number; side: string };
}



const ARROW_SIZE = 8;

export const HelpTooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'auto',
  offset = 8,
  arrow = true,
  trigger = 'hover',
  delay = { show: 300, hide: 100 },
  disabled = false,
  interactive = false,
  theme = 'dark',
  animation = 'fade',
  maxWidth = 300,
  className = '',
  id,
  role = 'tooltip',
  onShow,
  onHide,
  onToggle
}) => {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    isVisible: false,
    position: { top: 0, left: 0 },
    computedPosition: 'top',
    arrow: { side: 'bottom' }
  });
  
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const portalContainer = useRef<HTMLDivElement>();
  
  const triggers = Array.isArray(trigger) ? trigger : [trigger];
  const delayConfig = typeof delay === 'number' ? { show: delay, hide: delay } : delay;

  // Create portal container
  useEffect(() => {
    if (!portalContainer.current) {
      portalContainer.current = document.createElement('div');
      portalContainer.current.className = 'tooltip-portal';
      document.body.appendChild(portalContainer.current);
    }

    return () => {
      if (portalContainer.current?.parentNode) {
        portalContainer.current.parentNode.removeChild(portalContainer.current);
      }
    };
  }, []);

  // Position calculation
  const calculatePosition = useCallback((triggerEl: HTMLElement): Pick<TooltipState, 'position' | 'computedPosition' | 'arrow'> => {
    if (!tooltipRef.current) {
      return {
        position: { top: 0, left: 0 },
        computedPosition: 'top',
        arrow: { side: 'bottom' }
      };
    }

    const triggerRect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const scroll = { x: window.scrollX, y: window.scrollY };

    let finalPosition = position;
    
    // Auto positioning
    if (position === 'auto') {
      const spaceAbove = triggerRect.top;
      const spaceBelow = viewport.height - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewport.width - triggerRect.right;
      
      const requiredHeight = tooltipRect.height + offset + ARROW_SIZE;
      const requiredWidth = tooltipRect.width + offset + ARROW_SIZE;
      
      if (spaceBelow >= requiredHeight) {
        finalPosition = 'bottom';
      } else if (spaceAbove >= requiredHeight) {
        finalPosition = 'top';
      } else if (spaceRight >= requiredWidth) {
        finalPosition = 'right';
      } else if (spaceLeft >= requiredWidth) {
        finalPosition = 'left';
      } else {
        finalPosition = 'bottom'; // Fallback
      }
    }

    // Calculate position based on final positioning
    let top = 0;
    let left = 0;
    let arrowTop: number | undefined;
    let arrowLeft: number | undefined;
    let arrowSide = 'bottom';

    const arrowOffset = arrow ? ARROW_SIZE : 0;

    switch (finalPosition) {
      case 'top':
        top = triggerRect.top + scroll.y - tooltipRect.height - offset - arrowOffset;
        left = triggerRect.left + scroll.x + (triggerRect.width - tooltipRect.width) / 2;
        arrowTop = tooltipRect.height;
        arrowLeft = tooltipRect.width / 2 - ARROW_SIZE;
        arrowSide = 'bottom';
        break;
      
      case 'bottom':
        top = triggerRect.bottom + scroll.y + offset + arrowOffset;
        left = triggerRect.left + scroll.x + (triggerRect.width - tooltipRect.width) / 2;
        arrowTop = -ARROW_SIZE * 2;
        arrowLeft = tooltipRect.width / 2 - ARROW_SIZE;
        arrowSide = 'top';
        break;
      
      case 'left':
        top = triggerRect.top + scroll.y + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left + scroll.x - tooltipRect.width - offset - arrowOffset;
        arrowTop = tooltipRect.height / 2 - ARROW_SIZE;
        arrowLeft = tooltipRect.width;
        arrowSide = 'right';
        break;
      
      case 'right':
        top = triggerRect.top + scroll.y + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + scroll.x + offset + arrowOffset;
        arrowTop = tooltipRect.height / 2 - ARROW_SIZE;
        arrowLeft = -ARROW_SIZE * 2;
        arrowSide = 'left';
        break;
    }

    // Viewport boundary checking and adjustment
    const margin = 8;
    
    // Horizontal bounds
    if (left < margin) {
      const diff = margin - left;
      left = margin;
      if (arrowLeft !== undefined) arrowLeft = Math.max(ARROW_SIZE, arrowLeft - diff);
    } else if (left + tooltipRect.width > viewport.width - margin) {
      const diff = (left + tooltipRect.width) - (viewport.width - margin);
      left = viewport.width - tooltipRect.width - margin;
      if (arrowLeft !== undefined) arrowLeft = Math.min(tooltipRect.width - ARROW_SIZE * 2, arrowLeft + diff);
    }

    // Vertical bounds
    if (top < margin) {
      const diff = margin - top;
      top = margin;
      if (arrowTop !== undefined) arrowTop = Math.max(ARROW_SIZE, arrowTop - diff);
    } else if (top + tooltipRect.height > viewport.height - margin) {
      const diff = (top + tooltipRect.height) - (viewport.height - margin);
      top = viewport.height - tooltipRect.height - margin;
      if (arrowTop !== undefined) arrowTop = Math.min(tooltipRect.height - ARROW_SIZE * 2, arrowTop + diff);
    }

    return {
      position: { top, left },
      computedPosition: finalPosition,
      arrow: { top: arrowTop, left: arrowLeft, side: arrowSide }
    };
  }, [position, offset, arrow]);

  // Show tooltip
  const showTooltip = useCallback(() => {
    if (disabled || !triggerRef.current) return;

    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      const newState = calculatePosition(triggerRef.current!);
      setTooltipState(prev => ({ ...prev, isVisible: true, ...newState }));
      onShow?.();
      onToggle?.(true);
    }, delayConfig.show);
  }, [disabled, calculatePosition, delayConfig.show, onShow, onToggle]);

  // Hide tooltip
  const hideTooltip = useCallback(() => {
    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setTooltipState(prev => ({ ...prev, isVisible: false }));
      onHide?.();
      onToggle?.(false);
    }, delayConfig.hide);
  }, [delayConfig.hide, onHide, onToggle]);

  // Toggle tooltip (for click trigger)
  const toggleTooltip = useCallback(() => {
    if (tooltipState.isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  }, [tooltipState.isVisible, showTooltip, hideTooltip]);

  // Event handlers
  const handleMouseEnter = useCallback(() => {
    if (triggers.includes('hover')) {
      showTooltip();
    }
  }, [triggers, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    if (triggers.includes('hover') && !interactive) {
      hideTooltip();
    }
  }, [triggers, interactive, hideTooltip]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (triggers.includes('click')) {
      e.preventDefault();
      e.stopPropagation();
      toggleTooltip();
    }
  }, [triggers, toggleTooltip]);

  const handleFocus = useCallback(() => {
    if (triggers.includes('focus')) {
      showTooltip();
    }
  }, [triggers, showTooltip]);

  const handleBlur = useCallback(() => {
    if (triggers.includes('focus')) {
      hideTooltip();
    }
  }, [triggers, hideTooltip]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && tooltipState.isVisible) {
      hideTooltip();
    }
  }, [tooltipState.isVisible, hideTooltip]);

  // Interactive tooltip handlers
  const handleTooltipMouseEnter = useCallback(() => {
    if (interactive) {
      clearTimeout(timeoutRef.current);
    }
  }, [interactive]);

  const handleTooltipMouseLeave = useCallback(() => {
    if (interactive && triggers.includes('hover')) {
      hideTooltip();
    }
  }, [interactive, triggers, hideTooltip]);

  // Click outside handler
  useEffect(() => {
    if (!tooltipState.isVisible || !triggers.includes('click')) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        triggerRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        hideTooltip();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [tooltipState.isVisible, triggers, hideTooltip]);

  // Scroll and resize handlers
  useEffect(() => {
    if (!tooltipState.isVisible) return;

    const updatePosition = () => {
      if (triggerRef.current) {
        const newState = calculatePosition(triggerRef.current);
        setTooltipState(prev => ({ ...prev, ...newState }));
      }
    };

    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [tooltipState.isVisible, calculatePosition]);

  // Cleanup timeouts
  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  // Clone child with event handlers
  const triggerElement = cloneElement(children, {
    ref: (el: HTMLElement | null) => {
      if (triggerRef.current !== el) {
        (triggerRef as any).current = el;
      }
      // Handle original ref if present
      const originalRef = (children as any).ref;
      if (originalRef) {
        if (typeof originalRef === 'function') {
          originalRef(el);
        } else if (originalRef.current !== undefined) {
          originalRef.current = el;
        }
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      handleMouseEnter();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      handleMouseLeave();
    },
    onClick: (e: React.MouseEvent) => {
      children.props.onClick?.(e);
      handleClick(e);
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      handleFocus();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      handleBlur();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      children.props.onKeyDown?.(e);
      handleKeyDown(e);
    },
    'aria-describedby': tooltipState.isVisible ? (id || 'tooltip') : undefined
  });

  // Render tooltip portal
  const tooltipContent = tooltipState.isVisible && portalContainer.current && (
    <div
      ref={tooltipRef}
      id={id || 'tooltip'}
      role={role}
      className={[
        'help-tooltip',
        `tooltip-theme-${theme}`,
        `tooltip-animation-${animation}`,
        `tooltip-position-${tooltipState.computedPosition}`,
        interactive && 'tooltip-interactive',
        className
      ].filter(Boolean).join(' ')}
      style={{
        top: tooltipState.position.top,
        left: tooltipState.position.left,
        maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
        zIndex: 10001
      }}
      onMouseEnter={handleTooltipMouseEnter}
      onMouseLeave={handleTooltipMouseLeave}
    >
      <div className="tooltip-content">
        {content}
      </div>
      
      {arrow && (
        <div
          className={`tooltip-arrow tooltip-arrow-${tooltipState.arrow.side}`}
          style={{
            top: tooltipState.arrow.top,
            left: tooltipState.arrow.left
          }}
        />
      )}
    </div>
  );

  return (
    <>
      {triggerElement}
      {portalContainer.current && createPortal(tooltipContent, portalContainer.current)}
    </>
  );
};

// Compound components for complex tooltips
export const TooltipTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`tooltip-title ${className}`}>
    {children}
  </div>
);

export const TooltipDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`tooltip-description ${className}`}>
    {children}
  </div>
);

export const TooltipActions: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`tooltip-actions ${className}`}>
    {children}
  </div>
);

// Hook for programmatic tooltip control
export const useTooltip = () => {
  const [isVisible, setIsVisible] = useState(false);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(false), []);
  const toggle = useCallback(() => setIsVisible(prev => !prev), []);

  return {
    isVisible,
    show,
    hide,
    toggle,
    props: {
      trigger: 'manual' as const,
      onToggle: setIsVisible
    }
  };
};
