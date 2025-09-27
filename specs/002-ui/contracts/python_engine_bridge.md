# Contract: Python Engine Bridge

**Purpose**: IPC communication layer між Electron UI та Python particle animation engine  
**Responsibilities**: Message protocol, process management, error handling, status synchronization

## Interface Definition

### PythonEngineBridge
```typescript
interface PythonEngineBridge {
  // Process Lifecycle
  startEngine(): Promise<EngineStartResult>
  stopEngine(): Promise<void>
  restartEngine(): Promise<EngineStartResult>
  isEngineRunning(): boolean
  getEngineHealth(): EngineHealthStatus
  
  // Animation Commands
  startAnimation(config: AnimationConfig): Promise<void>
  pauseAnimation(): Promise<void>
  resumeAnimation(): Promise<void>
  stopAnimation(): Promise<void>
  skipToFinal(): Promise<void>
  
  // Settings Synchronization
  updateEngineSettings(settings: EngineSettings): Promise<void>
  loadImage(imagePath: string): Promise<ImageLoadResult>
  setWatermark(watermark: WatermarkConfig | null): Promise<void>
  
  // Status Monitoring
  onStatusUpdate(callback: (status: EngineStatus) => void): () => void
  onStageChange(callback: (stage: AnimationStage) => void): () => void
  onError(callback: (error: EngineError) => void): () => void
  onMetricsUpdate(callback: (metrics: EngineMetrics) => void): () => void
}

interface EngineStartResult {
  success: boolean
  processId?: number
  version?: string
  error?: string
  startupTime: number
}

interface EngineHealthStatus {
  isResponding: boolean
  lastHeartbeat: number
  memoryUsage?: number
  cpuUsage?: number
}

interface AnimationConfig {
  imagePath: string
  settings: EngineSettings
  watermark?: WatermarkConfig
}

interface EngineStatus {
  stage: AnimationStage
  isRunning: boolean
  isPaused: boolean
  progress: number // 0-1
  elapsedTime: number
}

interface EngineMetrics {
  fps: number
  particleCount: number
  memoryUsage: number
  recognitionAccuracy?: number
}
```

## Message Protocol Contracts

### Outgoing Messages (UI → Engine)
```typescript  
// Animation Control Messages
interface StartAnimationMessage {
  type: 'start_animation'
  payload: {
    image_path: string
    settings: {
      density: 'low' | 'medium' | 'high'
      speed: 'slow' | 'normal' | 'fast'  
      color_mode: 'stylish' | 'precise'
      background: BackgroundConfig
      breathing: { enabled: boolean, amplitude: number }
      loop: boolean
    }
    watermark?: {
      path: string
      position: string
      opacity: number
      scale: number
    }
  }
  messageId: string
  timestamp: number
}

// Settings Update Message
interface UpdateSettingsMessage {
  type: 'update_settings'
  payload: EngineSettings
  messageId: string
  timestamp: number
}

// Control Messages  
type ControlMessage = {
  type: 'pause' | 'resume' | 'stop' | 'skip_to_final' | 'restart'
  payload: {}
  messageId: string  
  timestamp: number
}

// Health Check Message
interface HealthCheckMessage {
  type: 'health_check'
  payload: {}
  messageId: string
  timestamp: number
}
```

### Incoming Messages (Engine → UI)
```typescript
// Status Update Message
interface StatusUpdateMessage {
  type: 'status_update'  
  payload: {
    stage: string
    is_running: boolean
    is_paused: boolean
    progress: number
    elapsed_time: number
  }
  messageId: string
  timestamp: number
}

// Metrics Update Message  
interface MetricsUpdateMessage {
  type: 'metrics_update'
  payload: {
    fps: number
    particle_count: number
    memory_usage: number
    recognition_accuracy?: number
  }
  messageId: string
  timestamp: number
}

// Error Message
interface ErrorMessage {
  type: 'error'
  payload: {
    error_code: string
    message: string
    details?: any
    recoverable: boolean
  }
  messageId: string
  timestamp: number
}

// Image Load Result
interface ImageLoadMessage {
  type: 'image_loaded'
  payload: {
    success: boolean
    image_info?: {
      width: number
      height: number
      format: string
      has_transparency: boolean
      dominant_colors: string[]
    }
    error?: string
  }
  messageId: string
  timestamp: number
}
```

## Behavioral Contracts

### Process Management
```typescript
// WHEN startEngine() called
// THEN Python subprocess запускається з engine script
// AND IPC channels (stdin/stdout) налаштовуються
// AND health check виконується протягом 5 seconds  
// AND startup message очікується протягом 10 seconds
// RETURN EngineStartResult з success/error details

// WHEN engine process crashes
// THEN onError callback викликається з crash details
// AND automatic restart attempted (max 3 times)
// AND UI receives engine_offline notification
// AND all pending promises rejected з error

// WHEN stopEngine() called
// THEN graceful shutdown message відправляється
// AND process termination очікується 5 seconds
// AND force kill виконується if needed
// AND IPC channels закриваються  
// AND cleanup callbacks викликаються
```

### Message Handling
```typescript  
// WHEN outgoing message sent
// THEN JSON serialization виконується
// AND message validation застосовується
// AND messageId generated для tracking
// AND timeout встановлюється (10s for commands, 30s for heavy ops)
// AND message sent через stdin IPC

// WHEN incoming message received
// THEN JSON parsing виконується safely
// AND message schema validation застосовується
// AND messageId correlation перевіряється
// AND appropriate callback викликається
// AND error handling для malformed messages

// WHEN message timeout occurs  
// THEN pending promise rejected з timeout error
// AND onError callback викликається
// AND health check triggered
// AND retry mechanism considered based on message type
```

### Error Recovery
```typescript
// WHEN communication timeout detected
// THEN health check message sent
// AND backup communication channel attempted  
// AND engine restart considered after 3 failures
// AND UI notification shown з recovery status

// WHEN invalid message received
// THEN message logged для debugging
// AND parsing error handled gracefully
// AND communication continues з next message
// AND validation error reported

// WHEN engine becomes unresponsive
// THEN process restart initiated
// AND current animation state saved if possible
// AND UI receives engine recovery notification
// AND automatic state restoration attempted
```

## Performance Requirements

### Communication Performance
- Message serialization: ≤5ms per message
- IPC roundtrip latency: ≤50ms for simple commands  
- Status updates frequency: max 60fps (16ms intervals)
- Health checks: every 5 seconds when idle

### Process Management Performance
- Engine startup: ≤3 seconds to ready state
- Graceful shutdown: ≤2 seconds
- Process restart: ≤5 seconds total
- Memory overhead: ≤20MB for bridge logic

### Throughput Management
- Max outgoing messages: 100/second
- Max incoming messages: 200/second (including metrics)
- Message queue size: 1000 pending messages max
- Automatic backpressure при queue overflow

## Error Handling Contracts

### Communication Errors
```typescript
// WHEN IPC channel broken
// THEN reconnection attempted every 2 seconds
// AND max 5 reconnection attempts  
// AND fallback to engine restart after failures
// AND user notification з recovery progress

// WHEN message parsing fails
// THEN error logged з raw message content
// AND communication continues з next message
// AND malformed message counter incremented
// AND health degradation tracked

// WHEN engine not responding
// THEN timeout escalation: 10s → 30s → restart
// AND pending operations cancelled gracefully
// AND UI state synchronized з known engine state
```

### Process Errors  
```typescript
// WHEN engine startup fails
// THEN detailed error information captured
// AND Python path/version diagnostics run
// AND dependency check performed  
// AND user-friendly error message generated
// AND retry options presented

// WHEN engine crashes during operation
// THEN crash dump captured if available
// AND animation state logged  
// AND automatic restart initiated
// AND crash report prepared (opt-in sending)
```

## Security Contracts

### Process Isolation
- Engine runs у separate process з restricted permissions
- No shell injection vulnerabilities у command construction  
- File paths sanitized перед передачею to engine
- Process communication обмежене to defined message protocol

### Data Validation
- All outgoing messages schema validated
- Incoming messages parsed safely з error handling
- File paths validated для existence та accessibility  
- No arbitrary code execution through message content

### Resource Management
- Process memory limits enforced
- CPU usage monitoring з throttling options
- Temporary file cleanup guaranteed
- IPC channel cleanup on process termination

## Testing Contracts  

### Unit Testing Requirements
```typescript
describe('PythonEngineBridge', () => {
  describe('process management', () => {
    it('starts engine successfully')
    it('handles engine startup failures')  
    it('performs graceful shutdown')
    it('recovers from engine crashes')
  })
  
  describe('message protocol', () => {
    it('sends animation commands correctly')
    it('receives status updates properly')
    it('handles message timeouts')
    it('validates message schemas')  
  })
  
  describe('error handling', () => {
    it('recovers from communication failures')
    it('handles malformed messages gracefully')
    it('manages process restart scenarios')
  })
})
```

### Integration Testing
```typescript
describe('Engine Integration', () => {
  it('performs full animation lifecycle')
  it('synchronizes settings correctly')  
  it('handles concurrent operations')
  it('maintains state consistency')
})
```

### Mock Testing Support
```typescript
interface MockEngineBridge extends PythonEngineBridge {
  simulateEngineState(state: EngineStatus): void
  simulateEngineError(error: EngineError): void
  simulateMessageDelay(delay: number): void
  injectMessage(message: IncomingMessage): void
}
```

## Dependencies

### External Dependencies
- Node.js child_process для subprocess management
- Node.js streams для IPC communication  
- JSON schema validation library
- Process monitoring utilities (optional)

### Internal Dependencies
- AnimationConfig data model
- EngineSettings data model
- Error notification system
- Logging infrastructure

## Invariants

### Communication Integrity
- Every outgoing message має unique messageId
- Message ordering preserved для sequential operations
- No message loss під normal conditions
- Timeout guarantees prevent indefinite waiting

### Process State Consistency
- isEngineRunning() accurately reflects process state
- Engine health status updated regularly
- Process lifecycle events properly synchronized
- Resource cleanup guaranteed on process termination

### Error Recovery Guarantees
- System може recover від будь-якого recoverable error  
- Non-recoverable errors reported clearly
- Process restart restores functional state
- No permanent communication deadlocks

Цей contract забезпечує reliable та performant communication layer між UI та Python engine з comprehensive error handling та recovery mechanisms.
