/**
 * PythonEngineBridge Implementation  
 * IPC communication layer між Electron UI та Python particle animation engine
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { app } from 'electron';
import type {
  EngineStartResult,
  EngineHealthStatus,
  StartAnimationPayload,
  EngineSettings,
  WatermarkConfig,
  ImageLoadResult,
  EngineStatus,
  EngineMetrics,
  EngineError,
  AnimationStage,
  OutgoingMessage,
  IncomingMessage
} from '../../shared/types';

export class PythonEngineBridge extends EventEmitter {
  private engineProcess: ChildProcess | null = null;
  private isStarting = false;
  private isStopping = false;
  private messageQueue: OutgoingMessage[] = [];
  private messageId = 0;
  private pendingMessages = new Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>();
  private lastHeartbeat = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly ENGINE_TIMEOUT = 10000; // 10 seconds
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds

  constructor(
    // @ts-ignore - enginePath is reserved for future use
    private readonly enginePath: string = path.join(app.getAppPath(), '..', 'python-engine', '__main__.py')
  ) {
    super();
    this.setupHealthCheck();
  }

  // Process Lifecycle
  async startEngine(): Promise<EngineStartResult> {
    if (this.engineProcess && !this.engineProcess.killed) {
      return {
        success: true,
        processId: this.engineProcess.pid,
        startupTime: 0
      };
    }

    if (this.isStarting) {
      throw new Error('Engine is already starting');
    }

    this.isStarting = true;
    const startTime = Date.now();

    try {
      // Use UV to run Python with project dependencies
      // UV automatically manages the virtual environment and dependencies
      const uvPath = process.env.UV_PATH || 'uv';
      const projectRoot = path.join(app.getAppPath(), '..', '..');
      
      // Start the Python engine process via UV
      this.engineProcess = spawn(uvPath, ['run', 'python', '-m', 'point_shoting.cli', '--ui-mode'], {
        cwd: projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          POINT_SHOTING_UI_MODE: '1'
        }
      });

      // Set up process event handlers
      this.setupProcessHandlers();

      // Wait for initial connection
      const connectionResult = await this.waitForConnection();
      
      const result: EngineStartResult = {
        success: connectionResult.success,
        processId: this.engineProcess.pid,
        version: connectionResult.version,
        error: connectionResult.error,
        startupTime: Date.now() - startTime
      };

      if (connectionResult.success) {
        this.lastHeartbeat = Date.now();
        this.processMessageQueue();
      } else {
        this.cleanup();
      }

      return result;

    } catch (error) {
      this.cleanup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        startupTime: Date.now() - startTime
      };
    } finally {
      this.isStarting = false;
    }
  }

  async stopEngine(): Promise<void> {
    if (!this.engineProcess || this.isStopping) {
      return;
    }

    this.isStopping = true;

    try {
      // Send graceful shutdown message
      await this.sendMessage({
        type: 'shutdown',
        payload: {},
        id: this.getNextMessageId()
      });

      // Wait for graceful shutdown with timeout
      const shutdownPromise = new Promise<void>((resolve) => {
        const onExit = () => {
          this.cleanup();
          resolve();
        };

        if (this.engineProcess) {
          this.engineProcess.once('exit', onExit);
          
          // Force kill after timeout
          setTimeout(() => {
            if (this.engineProcess && !this.engineProcess.killed) {
              this.engineProcess.kill('SIGKILL');
            }
          }, 5000);
        } else {
          resolve();
        }
      });

      await shutdownPromise;

    } catch (error) {
      console.error('Error during engine shutdown:', error);
      if (this.engineProcess && !this.engineProcess.killed) {
        this.engineProcess.kill('SIGKILL');
      }
    } finally {
      this.cleanup();
      this.isStopping = false;
    }
  }

  async restartEngine(): Promise<EngineStartResult> {
    await this.stopEngine();
    return this.startEngine();
  }

  isEngineRunning(): boolean {
    return !!(this.engineProcess && !this.engineProcess.killed);
  }

  getEngineHealth(): EngineHealthStatus {
    const now = Date.now();
    const isResponding = this.isEngineRunning() && (now - this.lastHeartbeat) < this.HEARTBEAT_INTERVAL * 2;

    return {
      isResponding,
      lastHeartbeat: this.lastHeartbeat,
      memoryUsage: undefined, // TODO: Implement memory monitoring
      cpuUsage: undefined // TODO: Implement CPU monitoring
    };
  }

  // Animation Commands
  async startAnimation(config: StartAnimationPayload): Promise<void> {
    await this.sendMessage({
      type: 'start_animation',
      id: this.getNextMessageId(),
      payload: {
        imagePath: config.imagePath,
        settings: config.settings,
        watermark: config.watermark
      }
    });
  }

  async pauseAnimation(): Promise<void> {
    await this.sendMessage({
      type: 'pause_animation',
      payload: {},
      id: this.getNextMessageId()
    });
  }

  async resumeAnimation(): Promise<void> {
    await this.sendMessage({
      type: 'resume_animation',
      payload: {},
      id: this.getNextMessageId()
    });
  }

  async stopAnimation(): Promise<void> {
    await this.sendMessage({
      type: 'stop_animation',
      payload: {},
      id: this.getNextMessageId()
    });
  }

  async skipToFinal(): Promise<void> {
    await this.sendMessage({
      type: 'skip_to_final',
      payload: {},
      id: this.getNextMessageId()
    });
  }

  // Settings Synchronization
  async updateEngineSettings(settings: EngineSettings): Promise<void> {
    await this.sendMessage({
      type: 'update_settings',
      id: this.getNextMessageId(),
      payload: settings
    });
  }

  async loadImage(imagePath: string): Promise<ImageLoadResult> {
    // TODO: Implement actual image loading through engine
    return await this.sendMessage({
      type: 'load_image',
      id: this.getNextMessageId(),
      payload: { path: imagePath, imagePath }
    });
  }

  async setWatermark(watermark: WatermarkConfig | null): Promise<void> {
    await this.sendMessage({
      type: 'set_watermark',
      id: this.getNextMessageId(),
      payload: { watermark }
    });
  }

  // Status Monitoring - Event Handlers
  onStatusUpdate(callback: (status: EngineStatus) => void): () => void {
    this.on('statusUpdate', callback);
    return () => this.removeListener('statusUpdate', callback);
  }

  onStageChange(callback: (stage: AnimationStage) => void): () => void {
    this.on('stageChange', callback);
    return () => this.removeListener('stageChange', callback);
  }

  onError(callback: (error: EngineError) => void): () => void {
    this.on('error', callback);
    return () => this.removeListener('error', callback);
  }

  onMetricsUpdate(callback: (metrics: EngineMetrics) => void): () => void {
    this.on('metricsUpdate', callback);
    return () => this.removeListener('metricsUpdate', callback);
  }

  // Private Methods
  private setupProcessHandlers(): void {
    if (!this.engineProcess) return;

    // Handle stdout (JSON messages from Python engine)
    this.engineProcess.stdout?.on('data', (data) => {
      this.handleEngineMessage(data.toString());
    });

    // Handle stderr (error logs)
    this.engineProcess.stderr?.on('data', (data) => {
      console.error('Engine stderr:', data.toString());
    });

    // Handle process exit
    this.engineProcess.on('exit', (code, signal) => {
      console.log(`Engine process exited with code ${code}, signal ${signal}`);
      this.cleanup();
      this.emit('engineExit', { code, signal });
    });

    // Handle process error
    this.engineProcess.on('error', (error) => {
      console.error('Engine process error:', error);
      this.emit('engineError', error);
      this.cleanup();
    });
  }

  private async waitForConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Connection timeout' });
      }, this.ENGINE_TIMEOUT);

      const onReady = (message: any) => {
        if (message.type === 'ready') {
          clearTimeout(timeout);
          resolve({
            success: true,
            version: message.payload?.version
          });
        }
      };

      this.once('engineReady', onReady);
    });
  }

  private handleEngineMessage(data: string): void {
    try {
      // Handle multiple JSON messages in single data chunk
      const lines = data.trim().split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          const message: IncomingMessage = JSON.parse(line);
          this.processIncomingMessage(message);
        }
      }
    } catch (error) {
      console.error('Failed to parse engine message:', data, error);
    }
  }

  private processIncomingMessage(message: IncomingMessage): void {
    this.lastHeartbeat = Date.now();

    // Handle message responses
      if (message._id && this.pendingMessages.has(message._id)) {
      const pending = this.pendingMessages.get(message._id)!;
      clearTimeout(pending.timeout);
      this.pendingMessages.delete(message._id);
      
      if (message.type === 'error' || message.type === 'error_occurred') {
        const errorPayload = message.payload as any;
        pending.reject(new Error(errorPayload?.error || errorPayload?.message || 'Engine error'));
      } else {
        pending.resolve(message);
      }
      return;
    }    // Handle status messages
    switch (message.type) {
      case 'ready':
        this.emit('engineReady', message);
        break;

      case 'status_update':
        this.emit('statusUpdate', message.payload as EngineStatus);
        break;

      case 'stage_change':
        this.emit('stageChange', message.payload?.stage as AnimationStage);
        break;

      case 'metrics_update':
        this.emit('metricsUpdate', message.payload as EngineMetrics);
        break;

      case 'error':
      case 'error_occurred':
        const errorPayload = message.payload as any;
        this.emit('error', {
          code: errorPayload?.code || 'UNKNOWN',
          message: errorPayload?.error || errorPayload?.message || 'Unknown error',
          details: errorPayload?.details,
          timestamp: Date.now(),
          fatal: errorPayload?.fatal || false
        } as EngineError);
        break;

      case 'heartbeat':
        // Heartbeat received, no action needed
        break;

      default:
        console.warn('Unknown message type from engine:', message.type);
    }
  }

  private async sendMessage(message: OutgoingMessage): Promise<any> {
    if (!this.isEngineRunning()) {
      throw new Error('Engine is not running');
    }

    return new Promise((resolve, reject) => {
      const msgId = message._id || message.id || this.getNextMessageId();
      
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(msgId);
        reject(new Error('Message timeout'));
      }, this.ENGINE_TIMEOUT);

      this.pendingMessages.set(msgId, { resolve, reject, timeout });

      const messageToSend = { ...message, _id: msgId, id: msgId };
      const messageStr = JSON.stringify(messageToSend) + '\n';
      
      if (this.engineProcess?.stdin?.writable) {
        this.engineProcess.stdin.write(messageStr);
      } else {
        this.pendingMessages.delete(msgId);
        clearTimeout(timeout);
        reject(new Error('Engine stdin not writable'));
      }
    });
  }

  private processMessageQueue(): void {
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of queue) {
      this.sendMessage(message).catch(error => {
        console.error('Failed to send queued message:', error);
      });
    }
  }

  private setupHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      if (this.isEngineRunning()) {
        // Send heartbeat
        this.sendMessage({
          type: 'heartbeat',
          payload: {},
          id: this.getNextMessageId()
        }).catch(error => {
          console.error('Heartbeat failed:', error);
        });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  private cleanup(): void {
    if (this.engineProcess && !this.engineProcess.killed) {
      this.engineProcess.kill();
    }
    this.engineProcess = null;

    // Reject all pending messages
    for (const [_id, pending] of this.pendingMessages) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Engine disconnected'));
    }
    this.pendingMessages.clear();

    // Clear message queue
    this.messageQueue = [];
  }

  private getNextMessageId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }

  // Cleanup method for proper resource disposal
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.cleanup();
    this.removeAllListeners();
  }
}
