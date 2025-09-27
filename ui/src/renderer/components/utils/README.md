# Utility Components

A comprehensive collection of essential UI utility components that provide core functionality across the application. These components handle error states, loading states, user notifications, confirmations, contextual help, and system information display.

## Components Overview

### ErrorBoundary
Error boundary component with fallback UI and error reporting capabilities.

**Features:**
- Catches JavaScript errors anywhere in the component tree
- Displays user-friendly error messages with retry functionality
- Error reporting integration for telemetry
- Expandable error details for developers
- Automatic retry mechanisms with exponential backoff

**Usage:**
```tsx
import { ErrorBoundary } from '@/components/utils';

<ErrorBoundary fallback={<CustomErrorUI />} onError={handleError}>
  <MyComponent />
</ErrorBoundary>
```

### LoadingSpinner
Animated loading spinner with multiple animation types and size variants.

**Features:**
- 7 animation types: spin, pulse, dots, bars, rings, wave, bounce
- 4 size variants: small, medium, large, extra-large
- 7 color themes with custom color support
- Overlay mode for full-screen loading
- Accessible with proper ARIA labels

**Usage:**
```tsx
import { LoadingSpinner } from '@/components/utils';

<LoadingSpinner 
  type="dots" 
  size="medium" 
  color="primary" 
  overlay 
  message="Loading..." 
/>
```

### ToastNotification
Comprehensive toast notification system with positioning and animations.

**Features:**
- 4 notification types: success, error, warning, info
- 6 positioning options (top/bottom + left/center/right)
- 4 animation types: slide, fade, bounce, scale
- Auto-dismiss with configurable timing
- Action buttons and persistent notifications
- Stacking system with collision handling
- Progress indicators for timed notifications

**Usage:**
```tsx
import { useToast } from '@/components/utils';

const toast = useToast();

// Simple notification
toast.success('Operation completed successfully');

// Complex notification with actions
toast.error('Failed to save', {
  duration: 5000,
  actions: [
    { label: 'Retry', onClick: retryOperation },
    { label: 'Cancel', onClick: cancelOperation }
  ]
});
```

### ConfirmDialog
Flexible confirmation dialog with multiple types and input support.

**Features:**
- 4 dialog types: confirm, alert, prompt, danger
- Input validation for prompt dialogs
- Customizable action buttons with loading states
- Accessibility with focus management and keyboard navigation
- Backdrop click and ESC key handling
- Promise-based API for easy integration

**Usage:**
```tsx
import { useConfirmDialog } from '@/components/utils';

const { confirm, alert, prompt, danger } = useConfirmDialog();

// Simple confirmation
const result = await confirm('Are you sure?');

// Dangerous action with custom styling
const deleteConfirmed = await danger('Delete this item?', {
  title: 'Confirm Deletion',
  confirmLabel: 'Delete Forever'
});

// Input prompt with validation
const name = await prompt('Enter your name:', '', {
  inputValidator: (value) => value.length < 2 ? 'Name too short' : null
});
```

### HelpTooltip
Rich tooltip system with smart positioning and interactive content.

**Features:**
- Multiple trigger types: hover, click, focus, manual
- Smart positioning with collision detection
- Rich content support (text, HTML, React components)
- 6 theme variants with custom styling
- Interactive content with hover handling
- Portal rendering to avoid z-index issues
- Mobile-friendly touch interactions

**Usage:**
```tsx
import { HelpTooltip, TooltipTitle, TooltipDescription } from '@/components/utils';

<HelpTooltip
  position="auto"
  theme="dark"
  trigger={['hover', 'focus']}
  content={
    <>
      <TooltipTitle>Feature Help</TooltipTitle>
      <TooltipDescription>
        This feature allows you to...
      </TooltipDescription>
    </>
  }
>
  <button>Help</button>
</HelpTooltip>
```

### VersionInfo
Comprehensive version and system information display.

**Features:**
- Application version, build info, and environment details
- System information (OS, architecture, Node.js version)
- Real-time performance metrics (CPU, memory usage)
- Dependency version listing
- Update checking and notification
- Export functionality for support tickets
- Copy-to-clipboard for individual values
- Collapsible sections for organized display

**Usage:**
```tsx
import { VersionInfo, useSystemInfo } from '@/components/utils';

const { systemInfo, systemMetrics } = useSystemInfo();

<VersionInfo
  versionData={systemInfo}
  systemMetrics={systemMetrics}
  showSystemInfo={true}
  showMetrics={true}
  showDependencies={true}
  onUpdateCheck={checkForUpdates}
  onExportInfo={exportSystemInfo}
/>
```

## Styling and Theming

All components support:
- **Light/Dark themes** with automatic detection
- **CSS custom properties** for easy customization
- **Responsive design** for mobile and desktop
- **High contrast mode** support for accessibility
- **Reduced motion** support for user preferences
- **Print styles** for documentation export

## Accessibility Features

- **ARIA labels and roles** for screen readers
- **Keyboard navigation** support
- **Focus management** with visible indicators
- **High contrast mode** compatibility
- **Reduced motion** respect for user preferences
- **Semantic HTML** structure

## Integration Examples

### Global Error Boundary
```tsx
// App.tsx
import { ErrorBoundary } from '@/components/utils';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Your app routes */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### Toast Provider Setup
```tsx
// App.tsx
import { ToastContainer } from '@/components/utils';

function App() {
  return (
    <div className="app">
      {/* Your app content */}
      <ToastContainer position="topRight" />
    </div>
  );
}
```

### Global Confirmation Hook
```tsx
// hooks/useGlobalConfirm.ts
import { useConfirmDialog } from '@/components/utils';

export const useGlobalConfirm = () => {
  const { confirm, danger } = useConfirmDialog();
  
  const confirmDelete = (itemName: string) => 
    danger(`Delete "${itemName}"?`, {
      title: 'Confirm Deletion',
      description: 'This action cannot be undone.'
    });
    
  return { confirm, confirmDelete };
};
```

## Best Practices

### Error Boundaries
- Place at strategic levels in your component tree
- Provide meaningful fallback UI
- Implement error reporting for production monitoring
- Test error scenarios during development

### Loading States
- Use appropriate spinner types for context
- Provide meaningful loading messages
- Consider skeleton loading for content areas
- Implement timeout handling for long operations

### User Notifications
- Use appropriate toast types for message severity
- Keep messages concise and actionable
- Provide relevant actions when possible
- Consider notification frequency to avoid spam

### Confirmations
- Use danger type for destructive actions
- Provide clear, specific confirmation messages
- Consider the cognitive load on users
- Implement consistent confirmation patterns

### Tooltips
- Keep content concise and helpful
- Use appropriate positioning for context
- Consider mobile interaction patterns
- Provide keyboard accessibility

### Version Information
- Keep dependency lists relevant and up-to-date
- Provide export functionality for support scenarios
- Include relevant system metrics for debugging
- Implement update checking where appropriate

## Performance Considerations

- **Portal rendering** prevents z-index issues
- **Event delegation** for efficient event handling
- **Memoization** for expensive calculations
- **Lazy loading** for heavy components
- **Cleanup** of timers and event listeners
- **Animation optimization** with CSS transforms

## Browser Support

- **Modern browsers** (Chrome 90+, Firefox 88+, Safari 14+)
- **Mobile browsers** with touch support
- **Accessibility tools** and screen readers
- **High contrast mode** in Windows
- **Reduced motion** preference support
