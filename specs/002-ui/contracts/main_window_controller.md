# Contract: Main Window Controller

**Purpose**: Головне вікно Electron app з координацією UI компонентів та IPC communication  
**Responsibilities**: Window lifecycle, component orchestration, Python engine communication

## Interface Definition

### MainWindowController
```typescript
interface MainWindowController {
  // Window Management
  initializeWindow(): Promise<void>
  showWindow(): void
  hideWindow(): void
  closeWindow(): Promise<void>
  
  // Application State
  getApplicationState(): ApplicationState
  updateApplicationState(state: Partial<ApplicationState>): void
  
  // Settings Management
  loadSettings(): Promise<UISettings>
  saveSettings(settings: UISettings): Promise<void>
  resetSettings(): Promise<void>
  
  // Python Engine Communication
  startEngine(): Promise<boolean>
  stopEngine(): Promise<void>  
  sendEngineCommand(command: OutgoingMessage): Promise<void>
  
  // Event Handling
  onEngineMessage(handler: (message: IncomingMessage) => void): void
  onWindowEvent(event: WindowEvent, handler: () => void): void
  onSettingsChanged(handler: (settings: UISettings) => void): void
}

interface ApplicationState {
  isEngineRunning: boolean
  currentAnimation: AnimationState | null
  loadedImage: ImageInfo | null
  notifications: NotificationMessage[]
  debugMode: boolean
}
```

## Behavioral Contracts

### Window Lifecycle
```typescript
// WHEN initializeWindow() called
// THEN window створюється з default розмірами
// AND settings завантажуються з Electron Store  
// AND IPC channels налаштовуються
// AND Python engine не стартує автоматично

// WHEN showWindow() called  
// THEN window стає visible та focused
// AND window bounds відновлюються з settings

// WHEN closeWindow() called
// THEN Python engine gracefully зупиняється
// AND settings зберігаються  
// AND temporary files очищуються
// AND window закривається без force
```

### Settings Persistence
```typescript  
// WHEN loadSettings() called
// THEN settings завантажуються з electron-store
// AND missing values заповнюються defaults
// AND validation застосовується до всіх values
// RETURN Promise<UISettings> with validated settings

// WHEN saveSettings(settings) called
// THEN settings validation виконується  
// AND invalid values відхиляються з error
// AND valid settings зберігаються в electron-store
// AND onSettingsChanged handlers викликаються

// WHEN resetSettings() called
// THEN all settings скидаються до factory defaults
// AND electron-store очищується
// AND onSettingsChanged handlers викликаються з defaults
```

### Python Engine Integration
```typescript
// WHEN startEngine() called  
// THEN Python subprocess запускається
// AND IPC channels налаштовуються
// AND health check виконується протягом 5s
// RETURN Promise<boolean> - true if engine ready

// WHEN sendEngineCommand(command) called
// THEN command validation виконується
// AND message відправляється через IPC  
// AND timeout встановлюється 10s для response
// THROW error if engine not running або timeout

// WHEN stopEngine() called
// THEN graceful shutdown signal відправляється
// AND force kill після 5s timeout
// AND IPC channels закриваються
// AND engine process cleanup виконується
```

### Error Handling  
```typescript
// WHEN Python engine crashes
// THEN error notification показується
// AND restart option пропонується користувачу
// AND animation state скидається

// WHEN IPC communication fails
// THEN retry mechanism активується (3 attempts)  
// AND fallback error state встановлюється
// AND user notification показується

// WHEN settings file corrupted
// THEN backup settings відновлюються
// OR default settings завантажуються
// AND corruption warning показується
```

## Performance Requirements

### Startup Performance  
- Window initialization: ≤1s
- Settings loading: ≤200ms  
- Python engine startup: ≤3s
- Total app ready time: ≤5s

### Runtime Performance
- Settings save: ≤100ms
- IPC message handling: ≤50ms
- Window operations (show/hide): ≤100ms  
- Memory usage: ≤100MB (without Python engine)

### Resource Management
- File handle cleanup on window close
- IPC channel disposal  
- Event listener cleanup
- Python process termination guarantee

## Security Contracts

### Process Isolation
- Renderer process не має direct Python access
- All engine communication через Main process IPC
- File operations обмежені до user-selected directories  
- No arbitrary code execution в renderer

### Data Validation
- All IPC messages schema validated
- File paths sanitized перед передачею
- Settings values bounds checked  
- User input escaped в notifications

### Resource Access
- File dialogs обмежені до image/config formats
- Python engine запускається з restricted permissions  
- Network access заборонений (offline-first)
- Temporary files створюються у secure locations

## Testing Contracts

### Unit Testing Requirements
```typescript
describe('MainWindowController', () => {
  it('initializes window with default settings')
  it('saves and loads settings correctly')  
  it('handles Python engine lifecycle')
  it('validates IPC messages')
  it('cleans up resources on close')
})
```

### Integration Testing
```typescript  
describe('Engine Integration', () => {
  it('starts Python engine successfully')
  it('handles engine communication')
  it('recovers from engine crashes')  
  it('synchronizes settings with engine')
})
```

### Error Scenario Testing
```typescript
describe('Error Handling', () => {
  it('handles corrupted settings gracefully')
  it('recovers from IPC failures')
  it('manages engine startup failures')
  it('prevents resource leaks on errors')  
})
```

## Dependencies  

### External Dependencies
- Electron BrowserWindow API
- electron-store для settings persistence
- Node.js child_process для Python engine  
- Node.js fs/path для file operations

### Internal Dependencies  
- UISettings data model
- AnimationState data model
- IPC message protocols
- NotificationMessage система

## Invariants

### State Consistency
- ApplicationState завжди reflects actual system state
- Settings persistence guarantees atomic writes
- Python engine state синхронізований з UI state

### Resource Management  
- Тільки один Python engine process одночасно
- All IPC channels мають corresponding cleanup
- Window close завжди triggers complete cleanup

### Error Recovery
- System може recover від будь-якої non-fatal error
- Settings corruption не призводить до app crash
- Engine failures не corrupts UI state

Цей contract забезпечує reliable та performant головне вікно з clean separation між UI та engine concerns.
