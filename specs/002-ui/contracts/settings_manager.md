# Contract: Settings Manager

**Purpose**: Централізоване керування користувацькими налаштуваннями з validation, persistence та synchronization  
**Responsibilities**: Settings CRUD, validation, defaults, file import/export, change notifications

## Interface Definition

### SettingsManager
```typescript
interface SettingsManager {
  // Core Settings Operations
  getCurrentSettings(): UISettings
  updateSettings(updates: Partial<UISettings>): Promise<void>
  resetToDefaults(): Promise<void>
  validateSettings(settings: Partial<UISettings>): ValidationResult
  
  // Persistence
  loadFromStore(): Promise<UISettings>
  saveToStore(settings: UISettings): Promise<void>
  
  // Import/Export  
  exportToFile(filePath: string, settings: UISettings): Promise<void>
  importFromFile(filePath: string): Promise<UISettings>
  
  // Presets Management
  savePreset(name: string, description?: string): Promise<void>
  loadPreset(presetId: string): Promise<UISettings>
  deletePreset(presetId: string): Promise<void>
  listPresets(): Promise<PresetInfo[]>
  
  // Change Notifications
  onSettingsChanged(callback: (settings: UISettings) => void): () => void
  onValidationError(callback: (error: ValidationError) => void): () => void
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

interface PresetInfo {
  id: string
  name: string
  description?: string  
  createdAt: string
  filePath: string
}
```

## Behavioral Contracts

### Settings Validation
```typescript
// WHEN validateSettings(settings) called
// THEN all fields перевіряються according to rules:
//   - particleDensity: must be 'low' | 'medium' | 'high'
//   - animationSpeed: must be 'slow' | 'normal' | 'fast'  
//   - backgroundConfig: type-specific validation
//   - windowBounds: positive numbers, screen boundaries
//   - recentImages: existing file paths тільки
// RETURN ValidationResult з errors та warnings

// WHEN validation fails for critical fields
// THEN operation відхиляється з error
// AND original settings залишаються unchanged
// AND onValidationError callbacks викликаються

// WHEN validation має warnings тільки  
// THEN operation proceeds з warning logs
// AND warnings повертаються у ValidationResult
```

### Settings Persistence
```typescript
// WHEN updateSettings(updates) called
// THEN validation виконується first
// AND valid updates merge з current settings
// AND merged settings зберігаються to electron-store
// AND onSettingsChanged callbacks викликаються
// AND Promise resolves

// WHEN saveToStore(settings) fails  
// THEN backup attempt виконується
// AND error logged з details
// AND Promise rejects з error
// AND settings state не змінюється

// WHEN loadFromStore() called
// THEN settings читаються з electron-store
// AND missing fields заповнюються з defaults  
// AND validation застосовується
// AND corrupted data triggers fallback to defaults
// RETURN Promise<UISettings>
```

### File Operations
```typescript  
// WHEN exportToFile(path, settings) called
// THEN settings serialized to JSON format
// AND file written atomically (temp + rename)
// AND metadata added (version, timestamp)  
// AND file permissions set appropriately
// RETURN Promise resolves on success

// WHEN importFromFile(path) called  
// THEN file existence та readability перевіряються
// AND JSON parsing виконується safely
// AND version compatibility checked
// AND full validation applied to loaded settings
// RETURN Promise<UISettings> або reject з error

// WHEN file operations encounter permissions errors
// THEN clear error messages generated  
// AND alternative locations suggested
// AND operation fails gracefully
```

### Presets Management
```typescript
// WHEN savePreset(name, description) called  
// THEN current settings captured
// AND preset file створюється у presets directory
// AND metadata stored (name, description, timestamp)
// AND preset indexed для future listing

// WHEN loadPreset(presetId) called
// THEN preset file читається та parsed  
// AND settings validation виконується
// AND compatible settings повертаються
// THROW error if preset not found або corrupted

// WHEN deletePreset(presetId) called
// THEN preset file видаляється з disk
// AND index updated
// AND confirmation не required (UI handles)
```

## Data Validation Rules

### Animation Settings
```typescript
const ValidationRules = {
  particleDensity: ['low', 'medium', 'high'],
  animationSpeed: ['slow', 'normal', 'fast'],
  colorMode: ['stylish', 'precise'],
  backgroundType: ['solid', 'gradient', 'image'],
  
  // Numeric Ranges
  backgroundBlurRadius: { min: 0, max: 25 },
  watermarkOpacity: { min: 0, max: 1 },
  watermarkScale: { min: 0.01, max: 0.2 },
  
  // Window Bounds
  windowWidth: { min: 800, max: 4096 },
  windowHeight: { min: 600, max: 2160 }
}
```

### File Path Validation
```typescript  
// WHEN validating image paths
// THEN file existence перевіряється  
// AND format validation (PNG/JPG) виконується
// AND size limits checked (4096x4096 max)
// AND accessibility verified

// WHEN validating preset paths
// THEN JSON format validation
// AND schema version compatibility  
// AND settings content validation
```

### Background Configuration Validation
```typescript
// WHEN backgroundType is 'solid'  
// THEN color field must be valid hex code
// AND opacity між 0-1

// WHEN backgroundType is 'gradient'
// THEN startColor та endColor must be valid hex
// AND direction must be valid enum value

// WHEN backgroundType is 'image'  
// THEN path must point to valid image file
// AND blurRadius між 0-25
// AND opacity між 0-1
```

## Performance Requirements

### Validation Performance
- Settings validation: ≤10ms для full validation
- File path checks: ≤50ms per file  
- Background image validation: ≤200ms
- Preset loading: ≤100ms per preset

### Persistence Performance  
- Settings save to store: ≤50ms
- Settings load from store: ≤30ms
- Export to file: ≤200ms
- Import from file: ≤300ms

### Memory Management
- Settings object caching with TTL
- File watcher cleanup on unused paths
- Preset metadata lazy loading
- Change notification debouncing (100ms)

## Error Handling Contracts

### Validation Errors
```typescript
// WHEN invalid enum value provided
// THEN ValidationError з available options
// AND field-specific error message
// AND operation blocked

// WHEN numeric value out of range  
// THEN ValidationError з min/max bounds
// AND suggested valid value
// AND operation blocked

// WHEN file path invalid
// THEN ValidationWarning if file not found
// AND ValidationError if format unsupported  
// AND path suggestions provided
```

### Persistence Errors
```typescript
// WHEN electron-store write fails
// THEN backup mechanism attempted  
// AND user notification shown
// AND original settings preserved
// AND retry option provided

// WHEN import file corrupted
// THEN parsing errors caught safely
// AND detailed error message shown  
// AND no partial state updates
// AND original settings unchanged
```

### Recovery Mechanisms  
```typescript
// WHEN settings completely corrupted
// THEN factory defaults restored
// AND corruption backup created
// AND user notification з recovery details

// WHEN preset directory missing  
// THEN directory recreated automatically
// AND default presets installed
// AND operation continues normally
```

## Testing Contracts

### Unit Testing Requirements
```typescript
describe('SettingsManager', () => {
  describe('validation', () => {
    it('validates all enum fields correctly')
    it('enforces numeric ranges')  
    it('validates file paths')
    it('handles complex background configs')
  })
  
  describe('persistence', () => {
    it('saves and loads settings correctly')
    it('handles corrupted store gracefully')
    it('manages concurrent access safely')
  })
  
  describe('presets', () => {
    it('creates and loads presets')
    it('handles preset conflicts') 
    it('validates preset compatibility')
  })
})
```

### Integration Testing
```typescript
describe('Settings Integration', () => {
  it('synchronizes with Python engine')
  it('persists across app restarts')
  it('handles file system errors')
  it('manages cross-platform paths correctly')
})
```

## Security Contracts

### File System Access
- Import/export обмежені до user-selected directories
- Path traversal attacks prevented  
- File type validation enforced
- Temporary file cleanup guaranteed

### Data Integrity
- Atomic file operations (temp + rename)
- Settings backup before risky operations
- Validation prevents injection attacks
- Schema versioning prevents compatibility issues

## Dependencies

### External Dependencies  
- electron-store для persistence
- Node.js fs/path для file operations
- JSON schema validation library
- File type detection utilities

### Internal Dependencies
- UISettings data model
- PresetConfig data model  
- NotificationMessage система
- File path utilities

## Invariants

### Data Consistency
- Settings завжди valid після operations
- Persistent store завжди contains valid JSON
- Change notifications завжди reflect actual changes

### Error Recovery
- Failed operations не corrupt existing settings  
- System може recover від будь-якого persistence error
- Validation errors не prevent app functionality

### Performance Guarantees
- Settings operations не block UI thread
- File operations timeout після reasonable period
- Memory usage bounded для large preset collections

Цей contract гарантує robust settings management з comprehensive validation, reliable persistence та clean error handling.
