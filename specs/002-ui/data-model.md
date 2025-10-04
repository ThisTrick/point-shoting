# Data Model: Electron UI для системи анімації частинок

**Branch**: `002-ui` | **Generated**: 2025-09-27  
**Input**: UI entities та їх взаємодії в Electron application

## Core Entities

### UISettings
Користувацькі налаштування інтерфейсу з persistence через Electron Store
```typescript
interface UISettings {
  // Appearance
  theme: 'light' | 'dark' | 'system'
  language: 'uk' | 'en' 
  windowBounds: { width: number, height: number, x?: number, y?: number }
  
  // Animation Settings (передаються до Python engine)
  particleDensity: 'low' | 'medium' | 'high'
  animationSpeed: 'slow' | 'normal' | 'fast'  
  colorMode: 'stylish' | 'precise'
  backgroundType: 'solid' | 'gradient' | 'image'
  backgroundConfig: BackgroundConfig
  
  // Debug & Advanced
  debugHudEnabled: boolean
  performanceWarnings: boolean
  autoSave: boolean
  
  // Recent Files
  recentImages: string[] // paths to recent image files
  recentPresets: string[] // paths to preset configuration files
}
```

### BackgroundConfig  
Конфігурація фону для анімації
```typescript
interface BackgroundConfig {
  solid?: {
    color: string // hex color
  }
  gradient?: {
    startColor: string
    endColor: string  
    direction: 'horizontal' | 'vertical' | 'radial'
  }
  image?: {
    path: string
    blurRadius: number // 0-25 px Gaussian blur
    opacity: number // 0-1
  }
}
```

### AnimationState
Поточний стан анімації з Python engine
```typescript
interface AnimationState {
  // Current Status  
  stage: 'PRE_START' | 'BURST' | 'CHAOS' | 'CONVERGING' | 'FORMATION' | 'FINAL_BREATHING'
  isRunning: boolean
  isPaused: boolean
  
  // Metrics з Python engine
  currentFPS: number
  particleCount: number  
  recognitionProgress: number // 0-1 for convergence
  elapsedTime: number // seconds since start
  
  // Loaded Resources
  sourceImage?: ImageInfo
  watermark?: WatermarkInfo
  
  // Error State
  error?: string
  lastErrorTimestamp?: number
}
```

### ImageInfo
Інформація про завантажене зображення
```typescript  
interface ImageInfo {
  path: string
  filename: string
  format: 'PNG' | 'JPG'
  dimensions: { width: number, height: number }
  fileSize: number // bytes
  aspectRatio: number
  
  // Processing info
  isValid: boolean
  hasTransparentPixels: boolean
  dominantColors?: string[] // hex colors для preview
  
  // Validation
  exceedsMaxSize: boolean // >4096px в будь-якій стороні
  warnings?: string[]
}
```

### WatermarkInfo
Конфігурація водяного знака
```typescript
interface WatermarkInfo {
  enabled: boolean
  path?: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity: number // 0-1
  scale: number // 0-1, відносно розміру сцени
  
  // Validation (тільки PNG, мін 64px)
  isValid: boolean
  validationError?: string
}
```

### PresetConfig
Збережена конфігурація налаштувань
```typescript
interface PresetConfig {
  name: string
  description?: string  
  createdAt: string // ISO date
  
  // Animation parameters
  settings: Partial<UISettings> // exclude UI-specific settings
  
  // Export metadata  
  version: string // config format version
  engineVersion?: string // compatible Python engine version
}
```

### NotificationMessage
Повідомлення для користувача (помилки, попередження, інфо)
```typescript
interface NotificationMessage {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: number
  
  // Behavior
  autoClose: boolean
  closeAfter?: number // ms
  persistent: boolean // зберігається між сесіями
  
  // Actions
  actions?: NotificationAction[]
}

interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'danger'
}
```

### IPCMessage  
Протокол комунікації з Python engine
```typescript
// UI → Python Engine
type OutgoingMessage = 
  | { type: 'start_animation', payload: StartAnimationPayload }
  | { type: 'pause_animation', payload: {} }
  | { type: 'resume_animation', payload: {} }
  | { type: 'restart_animation', payload: {} }
  | { type: 'skip_to_final', payload: {} }
  | { type: 'update_settings', payload: EngineSettings }
  | { type: 'load_image', payload: { path: string } }
  | { type: 'shutdown', payload: {} }

// Python Engine → UI  
type IncomingMessage =
  | { type: 'status_update', payload: StatusPayload }
  | { type: 'stage_changed', payload: { stage: string, timestamp: number } }
  | { type: 'error_occurred', payload: { error: string, details?: any } }
  | { type: 'image_loaded', payload: ImageValidation }
  | { type: 'animation_complete', payload: { finalRecognition: number } }
  | { type: 'fps_update', payload: { fps: number, particles: number } }

interface StartAnimationPayload {
  imagePath: string
  settings: EngineSettings
  watermark?: WatermarkConfig
}

interface StatusPayload {
  stage: string
  fps: number  
  particles: number
  progress: number
  elapsedTime: number
}

interface EngineSettings {
  density: string
  speed: string  
  colorMode: string
  background: BackgroundConfig
  breathing: { enabled: boolean, amplitude: number }
  loop: boolean
}
```

### KeyboardShortcut
Конфігурація клавіатурних скорочень
```typescript
interface KeyboardShortcut {
  id: string
  key: string // 'Space', 'KeyR', 'KeyS', 'F1', etc
  modifiers?: ('Ctrl' | 'Alt' | 'Shift' | 'Meta')[]
  action: string // action identifier
  description: string // для help overlay
  context?: 'global' | 'animation' | 'settings' // де активне
}
```

## Entity Relationships

### State Flow
```
UISettings ←→ Electron Store (persistence)
UISettings → EngineSettings (transformation для Python)  
ImageInfo ← File System (завантаження через dialog)
AnimationState ← Python Engine (через IPC)
NotificationMessage ← Error/Warning events  
PresetConfig ↔ File System (import/export)
```

### Component Dependencies  
```
MainWindow 
├── ControlPanel (UISettings → UI controls)
├── AnimationViewport (AnimationState → visual display)  
├── StatusBar (AnimationState → metrics display)
├── NotificationContainer (NotificationMessage[])
└── MenuBar (KeyboardShortcut[], actions)

SettingsDialog
├── AnimationSettings (UISettings.animation*)
├── AppearanceSettings (UISettings.theme, language)  
├── KeyboardSettings (KeyboardShortcut[])
└── PresetManager (PresetConfig[])
```

### Data Persistence
```
Electron Main Process:
- electron-store → UISettings  
- File system → ImageInfo, PresetConfig
- IPC channels → communication з Python

Electron Renderer Process:  
- React state → UI component state
- Context providers → shared state (settings, animation)
- Local storage → temporary UI state (opened panels, etc.)
```

## Validation Rules

### Image Validation
- **Supported formats**: PNG, JPG тільки
- **Max dimensions**: 4096x4096 pixels per side  
- **File size**: реалістичний warning при >50MB
- **Path validation**: readable file, exists, не corrupted

### Watermark Validation  
- **Format**: PNG тільки (для transparency)
- **Min size**: 64px shortest side
- **Max scale**: 20% of scene size
- **Path validation**: same як image

### Settings Validation
- **Particle density**: enum validation
- **Performance settings**: bounds checking
- **Color values**: valid hex codes
- **File paths**: existence і accessibility

### IPC Message Validation
- **Required fields**: schema validation
- **Type safety**: TypeScript interfaces
- **Size limits**: prevent oversized payloads  
- **Rate limiting**: debounce rapid updates

## Error Handling Strategies

### File Loading Errors
- Invalid format → show supported formats list
- File not found → file picker dialog  
- Permission denied → clear error message + suggestions
- Corrupted file → validation error with file details

### Python Engine Errors  
- Engine crash → restart option + error report
- Communication timeout → retry mechanism
- Invalid settings → validation before sending
- Performance warnings → user notification + reduce quality suggestion

### UI State Errors
- Settings corruption → reset to defaults option
- Window bounds invalid → reset to center screen
- Preset loading fails → skip або restore backup

## Performance Considerations  

### Memory Management
- **Image caching**: LRU cache для recent images  
- **Preview generation**: async thumbnail creation
- **State cleanup**: unmount listeners, dispose resources

### Update Throttling
- **FPS updates**: max 60fps від Python engine  
- **Settings changes**: 300ms debounce before sending
- **File watching**: debounce file system events

### Lazy Loading
- **Components**: dynamic imports для heavy dialogs
- **Images**: progressive loading для large files
- **Presets**: load metadata first, full config on demand

## Security Considerations

### File Access
- **Sandboxing**: renderer process не має direct file access
- **Path validation**: prevent directory traversal  
- **Type checking**: validate file headers, не тільки extensions

### IPC Security  
- **Message validation**: strict schema enforcement
- **Process isolation**: crash в Python не впливає на UI
- **Resource limits**: prevent memory/CPU bombs через IPC

### Data Privacy
- **Local storage**: всі data локально
- **Telemetry**: opt-in тільки, anonymous
- **File paths**: не логуємо повні шляхи in production

Це data model забезпечує type-safe interaction між UI компонентами, reliable persistence, та clean integration з Python engine через well-defined protocols.
