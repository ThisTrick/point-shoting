# Contract: File Manager

**Purpose**: Централізоване керування файловими операціями для зображень, конфігурацій та ресурсів  
**Responsibilities**: File dialogs, validation, preview generation, recent files tracking, file watching

## Interface Definition

### FileManager
```typescript
interface FileManager {
  // Image Operations
  selectImageFile(): Promise<ImageFileResult | null>
  validateImageFile(path: string): Promise<ImageValidationResult>
  generateImagePreview(path: string, maxSize: number): Promise<string> // base64
  getImageMetadata(path: string): Promise<ImageMetadata>
  
  // Configuration Operations
  selectConfigFile(mode: 'import' | 'export'): Promise<string | null>
  saveConfigFile(path: string, config: PresetConfig): Promise<void>
  loadConfigFile(path: string): Promise<PresetConfig>
  validateConfigFile(path: string): Promise<ConfigValidationResult>
  
  // Watermark Operations
  selectWatermarkFile(): Promise<WatermarkFileResult | null>
  validateWatermarkFile(path: string): Promise<WatermarkValidationResult>
  
  // Recent Files Management
  getRecentImages(): Promise<RecentFileInfo[]>
  addToRecentImages(path: string): Promise<void>
  removeFromRecentImages(path: string): Promise<void>
  clearRecentImages(): Promise<void>
  
  // File System Utilities
  watchFile(path: string, callback: (event: FileChangeEvent) => void): FileWatcher
  unwatchFile(watcher: FileWatcher): void
  getFileStats(path: string): Promise<FileStats>
  fileExists(path: string): Promise<boolean>
}

interface ImageFileResult {
  path: string
  filename: string
  metadata: ImageMetadata
  validationResult: ImageValidationResult
}

interface ImageValidationResult {
  isValid: boolean
  format?: 'PNG' | 'JPG'
  errors: ValidationError[]
  warnings: ValidationError[]
  metadata?: ImageMetadata
}

interface ImageMetadata {
  width: number
  height: number
  format: string
  fileSize: number
  hasTransparency: boolean
  dominantColors: string[]
  aspectRatio: number
  colorSpace?: string
}

interface WatermarkFileResult {
  path: string
  filename: string
  validationResult: WatermarkValidationResult
}

interface WatermarkValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  metadata?: {
    width: number
    height: number
    hasTransparency: boolean
  }
}

interface RecentFileInfo {
  path: string
  filename: string
  lastUsed: number
  fileSize: number
  isAccessible: boolean
  thumbnailPath?: string
}

interface FileStats {
  size: number
  created: number
  modified: number
  accessed: number
  isDirectory: boolean
  permissions: FilePermissions
}

interface FilePermissions {
  readable: boolean
  writable: boolean
  executable: boolean
}
```

## Behavioral Contracts

### File Selection Operations
```typescript
// WHEN selectImageFile() called
// THEN native file dialog відкривається
// AND filters встановлені для PNG/JPG files only
// AND multiple selection disabled  
// AND user can cancel → return null
// AND selected file validates automatically
// RETURN ImageFileResult з validation results

// WHEN selectConfigFile('export') called  
// THEN save dialog відкривається з .json extension
// AND default filename suggested (timestamp-based)
// AND overwrite confirmation handled by system
// RETURN file path або null if cancelled

// WHEN selectConfigFile('import') called
// THEN open dialog відкривається з .json filter
// AND preview pane shows config metadata if available
// AND validation performed on selection
// RETURN file path або null if cancelled
```

### File Validation
```typescript
// WHEN validateImageFile(path) called
// THEN file existence перевіряється first  
// AND file format detection виконується (magic numbers)
// AND image dimensions читаються
// AND file size limits checked (practical: <100MB warning)
// AND max dimensions validated (4096x4096)
// AND transparency detection performed
// RETURN comprehensive ImageValidationResult

// WHEN validation detects unsupported format
// THEN clear error message generated
// AND supported formats listed
// AND validation fails з isValid: false

// WHEN image exceeds size limits  
// THEN warning generated з actual dimensions
// AND suggested alternatives provided
// AND validation marked з warnings
```

### Preview Generation
```typescript
// WHEN generateImagePreview(path, maxSize) called
// THEN image loaded у memory-efficient manner
// AND aspect ratio preserved during resize
// AND quality optimization applied  
// AND base64 encoding performed
// AND thumbnail caching considered
// RETURN base64 string або throw error

// WHEN preview generation fails
// THEN fallback placeholder generated
// AND error logged з details
// AND generic icon returned
// AND operation не blocks UI
```

### Recent Files Management
```typescript
// WHEN addToRecentImages(path) called
// THEN path added to top of recent list
// AND duplicates removed (move existing to top)
// AND list truncated to max 20 items
// AND file accessibility checked
// AND thumbnail generation triggered async

// WHEN getRecentImages() called  
// THEN cached list returned immediately
// AND accessibility validation performed async
// AND inaccessible files marked та optionally removed
// AND thumbnails loaded if available
// RETURN RecentFileInfo[] sorted by lastUsed desc

// WHEN file deletion detected  
// THEN file removed from recent list automatically
// AND thumbnail cleanup performed
// AND UI notifications sent if file was active
```

### File System Monitoring
```typescript
// WHEN watchFile(path, callback) called
// THEN file system watcher created
// AND change events filtered (modify, delete, rename)
// AND callback invoked with event details
// AND watcher resource tracked для cleanup
// RETURN FileWatcher handle

// WHEN watched file modified externally
// THEN callback invoked з 'modified' event
// AND file reload suggested to user
// AND validation re-run if needed

// WHEN watched file deleted  
// THEN callback invoked з 'deleted' event
// AND file removed from recent lists
// AND user notification shown
// AND active operations cancelled gracefully
```

## File Format Support

### Image Format Validation
```typescript
const SupportedImageFormats = {
  PNG: {
    extensions: ['.png'],
    mimeTypes: ['image/png'],
    magicNumbers: [[0x89, 0x50, 0x4E, 0x47]],
    maxSize: { width: 4096, height: 4096 },
    features: ['transparency', 'lossless']
  },
  JPG: {
    extensions: ['.jpg', '.jpeg'],  
    mimeTypes: ['image/jpeg'],
    magicNumbers: [[0xFF, 0xD8, 0xFF]],
    maxSize: { width: 4096, height: 4096 },
    features: ['lossy', 'no_transparency']
  }
}

// Validation Process:
// 1. File extension check
// 2. Magic number verification  
// 3. Header parsing для dimensions
// 4. Size limit validation
// 5. Transparency detection (PNG only)
// 6. Color profile analysis (optional)
```

### Configuration File Format
```typescript
interface ConfigFileFormat {
  version: string // schema version  
  metadata: {
    name: string
    description?: string
    createdAt: string
    appVersion: string
  }
  settings: Partial<UISettings>
  checksum?: string // для integrity validation
}

// Validation Rules:
// - Version compatibility check
// - Settings schema validation
// - Checksum verification if present
// - Migration support для older versions
```

### Watermark Format Requirements
```typescript
const WatermarkRequirements = {
  format: 'PNG', // only PNG for transparency support
  minSize: { width: 64, height: 64 },
  maxSize: { width: 2048, height: 2048 },
  maxFileSize: 10 * 1024 * 1024, // 10MB
  requiredFeatures: ['transparency_support']
}
```

## Performance Requirements

### File Operations Performance  
- File selection dialog: opens ≤500ms
- Image validation: ≤200ms for typical files
- Preview generation: ≤1s для images ≤20MB
- Config file operations: ≤100ms
- Recent files loading: ≤50ms

### Caching Strategy
- Image previews cached до 50MB total
- Recent file thumbnails cached до 20MB
- Metadata caching з TTL 5 minutes
- File stats caching з invalidation on change

### Memory Management
- Large images processed у streaming manner
- Preview generation використовує worker threads
- File watchers cleaned up automatically
- Cache eviction based on LRU policy

## Error Handling Contracts

### File System Errors
```typescript
// WHEN file not found
// THEN FileNotFoundError з suggested alternatives
// AND recent files check performed  
// AND user guidance provided

// WHEN permission denied
// THEN PermissionError з clear explanation
// AND alternative locations suggested
// AND admin/sudo guidance if appropriate

// WHEN corrupted file detected
// THEN CorruptedFileError з recovery suggestions
// AND partial data extraction attempted
// AND backup recommendations provided
```

### Format Validation Errors  
```typescript
// WHEN unsupported image format
// THEN UnsupportedFormatError з format details
// AND conversion suggestions provided
// AND supported formats listed clearly

// WHEN image too large
// THEN OversizeError з actual та max dimensions
// AND resize suggestions provided  
// AND quality/performance implications explained

// WHEN invalid config file
// THEN ConfigValidationError з specific field errors
// AND schema documentation referenced
// AND example valid config provided
```

### Recovery Mechanisms
```typescript
// WHEN file operations fail
// THEN automatic retry attempted (max 3 times)  
// AND alternative approaches tried
// AND fallback options presented
// AND operation state preserved для resume

// WHEN validation fails
// THEN detailed feedback provided
// AND fix suggestions offered
// AND partial results preserved if useful
// AND user education integrated
```

## Security Contracts

### Path Security
- All file paths validated проти directory traversal
- Symlinks resolved та validated
- Access permissions checked before operations
- Temporary files created in secure locations

### File Content Security
- Image files parsed safely без arbitrary code execution
- Magic number validation prevents format spoofing  
- File size limits prevent DoS attacks
- Config files schema validated before parsing

### Privacy Protection  
- Recent files stored encrypted if sensitive
- File paths не logged in production mode
- Temporary previews cleaned up automatically
- No file content transmitted externally

## Testing Contracts

### Unit Testing Requirements
```typescript
describe('FileManager', () => {
  describe('image operations', () => {
    it('validates supported image formats')
    it('generates previews correctly')  
    it('handles oversized images')
    it('detects transparency accurately')
  })
  
  describe('file system operations', () => {
    it('handles file selection dialogs')
    it('manages recent files correctly')
    it('watches file changes properly')  
    it('validates permissions accurately')
  })
  
  describe('error handling', () => {
    it('handles file not found gracefully')
    it('recovers from permission errors')
    it('manages corrupted files safely')
    it('provides clear error messages')
  })
})
```

### Integration Testing
```typescript  
describe('File System Integration', () => {
  it('works across different operating systems')
  it('handles network drives correctly')
  it('manages file locking scenarios')
  it('integrates with native file dialogs')
})
```

### Mock Testing Support
```typescript
interface MockFileManager extends FileManager {
  setMockFileSystem(files: MockFileSystem): void
  simulateFileChange(path: string, event: FileChangeEvent): void  
  simulatePermissionError(path: string): void
  injectValidationResult(path: string, result: ValidationResult): void
}
```

## Dependencies

### External Dependencies
- Electron dialog API для file selection
- Node.js fs/path для file system operations  
- Image processing library (sharp або similar)
- File type detection library
- File system watcher (chokidar)

### Internal Dependencies
- UISettings data model
- PresetConfig data model
- Validation error types
- Notification system

## Invariants

### File System Consistency
- File operations atomic where possible
- Validation results accurately reflect file state  
- Recent files list maintains consistency
- File watchers properly cleaned up

### Security Guarantees
- No unauthorized file access
- Path validation prevents traversal attacks
- File content parsing safe від malicious input
- Temporary files automatically cleaned up

### Performance Guarantees  
- File operations не block UI thread
- Memory usage bounded для large files
- Cache invalidation maintains accuracy
- Resource cleanup prevents memory leaks

Цей contract забезпечує comprehensive та secure file management з robust validation, efficient caching та excellent user experience.
