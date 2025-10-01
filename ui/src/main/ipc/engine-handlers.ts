/**
 * Engine Communication IPC Handlers
 * IPC handlers for communication with the Python particle animation engine
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { PythonEngineBridge } from '../services/PythonEngineBridge';
import {
  EngineStartResult,
  EngineHealthStatus,
  AnimationStage,
  EngineSettings,
  WatermarkConfig,
  ImageLoadResult,
  EngineStatus,
  EngineMetrics,
  EngineError,
  StartAnimationPayload
} from '@shared/types';

export class EngineIpcHandlers {
  constructor(private engineBridge: PythonEngineBridge) {
    this.registerHandlers();
    this.setupEngineEventForwarding();
  }

  private registerHandlers(): void {
    // Process Lifecycle
    ipcMain.handle('engine:start', this.handleStartEngine.bind(this));
    ipcMain.handle('engine:stop', this.handleStopEngine.bind(this));
    ipcMain.handle('engine:restart', this.handleRestartEngine.bind(this));
    ipcMain.handle('engine:is-running', this.handleIsRunning.bind(this));
    ipcMain.handle('engine:get-health', this.handleGetHealth.bind(this));

    // Animation Commands
    ipcMain.handle('engine:start-animation', this.handleStartAnimation.bind(this));
    ipcMain.handle('engine:pause-animation', this.handlePauseAnimation.bind(this));
    ipcMain.handle('engine:resume-animation', this.handleResumeAnimation.bind(this));
    ipcMain.handle('engine:stop-animation', this.handleStopAnimation.bind(this));
    ipcMain.handle('engine:skip-to-final', this.handleSkipToFinal.bind(this));

    // Settings Synchronization
    ipcMain.handle('engine:update-settings', this.handleUpdateSettings.bind(this));
    ipcMain.handle('engine:load-image', this.handleLoadImage.bind(this));
    ipcMain.handle('engine:set-watermark', this.handleSetWatermark.bind(this));

    // Direct Message Sending - Disabled due to type conflicts
    // ipcMain.handle('engine:send-message', this.handleSendMessage.bind(this));
  }

  private setupEngineEventForwarding(): void {
    // Forward engine events to all renderer processes
    this.engineBridge.onStatusUpdate((status: EngineStatus) => {
      // Broadcast to all renderer windows
      this.broadcastToRenderers('engine:status-update', status);
    });

    this.engineBridge.onStageChange((stage: AnimationStage) => {
      this.broadcastToRenderers('engine:stage-change', stage);
    });

    this.engineBridge.onError((error: EngineError) => {
      this.broadcastToRenderers('engine:error', error);
    });

    this.engineBridge.onMetricsUpdate((metrics: EngineMetrics) => {
      this.broadcastToRenderers('engine:metrics-update', metrics);
    });

    // Handle engine process lifecycle events
    this.engineBridge.on('engineExit', (exitInfo) => {
      this.broadcastToRenderers('engine:process-exit', exitInfo);
    });

    this.engineBridge.on('engineError', (error) => {
      this.broadcastToRenderers('engine:process-error', error);
    });

    this.engineBridge.on('engineReady', (readyInfo) => {
      this.broadcastToRenderers('engine:ready', readyInfo);
    });
  }

  // Process Lifecycle Handlers
  private async handleStartEngine(_event: IpcMainInvokeEvent): Promise<EngineStartResult> {
    try {
      return await this.engineBridge.startEngine();
    } catch (error) {
      console.error('Engine start error:', error);
      throw new Error(`Failed to start engine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleStopEngine(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      await this.engineBridge.stopEngine();
    } catch (error) {
      console.error('Engine stop error:', error);
      throw new Error(`Failed to stop engine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleRestartEngine(_event: IpcMainInvokeEvent): Promise<EngineStartResult> {
    try {
      return await this.engineBridge.restartEngine();
    } catch (error) {
      console.error('Engine restart error:', error);
      throw new Error(`Failed to restart engine: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private handleIsRunning(_event: IpcMainInvokeEvent): boolean {
    try {
      return this.engineBridge.isEngineRunning();
    } catch (error) {
      console.error('Engine status check error:', error);
      return false;
    }
  }

  private handleGetHealth(_event: IpcMainInvokeEvent): EngineHealthStatus {
    try {
      return this.engineBridge.getEngineHealth();
    } catch (error) {
      console.error('Engine health check error:', error);
      throw new Error(`Failed to get engine health: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Animation Command Handlers
  private async handleStartAnimation(_event: IpcMainInvokeEvent, config: StartAnimationPayload): Promise<void> {
    try {
      await this.engineBridge.startAnimation(config);
    } catch (error) {
      console.error('Start animation error:', error);
      throw new Error(`Failed to start animation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handlePauseAnimation(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      await this.engineBridge.pauseAnimation();
    } catch (error) {
      console.error('Pause animation error:', error);
      throw new Error(`Failed to pause animation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleResumeAnimation(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      await this.engineBridge.resumeAnimation();
    } catch (error) {
      console.error('Resume animation error:', error);
      throw new Error(`Failed to resume animation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleStopAnimation(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      await this.engineBridge.stopAnimation();
    } catch (error) {
      console.error('Stop animation error:', error);
      throw new Error(`Failed to stop animation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSkipToFinal(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      await this.engineBridge.skipToFinal();
    } catch (error) {
      console.error('Skip to final error:', error);
      throw new Error(`Failed to skip to final: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Settings Synchronization Handlers
  private async handleUpdateSettings(_event: IpcMainInvokeEvent, settings: EngineSettings): Promise<void> {
    try {
      await this.engineBridge.updateEngineSettings(settings);
    } catch (error) {
      console.error('Update engine settings error:', error);
      throw new Error(`Failed to update engine settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleLoadImage(_event: IpcMainInvokeEvent, imagePath: string): Promise<ImageLoadResult> {
    try {
      return await this.engineBridge.loadImage(imagePath);
    } catch (error) {
      console.error('Load image error:', error);
      throw new Error(`Failed to load image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSetWatermark(_event: IpcMainInvokeEvent, watermark: WatermarkConfig | null): Promise<void> {
    try {
      await this.engineBridge.setWatermark(watermark);
    } catch (error) {
      console.error('Set watermark error:', error);
      throw new Error(`Failed to set watermark: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Direct Message Handler - Temporarily disabled due to type conflicts
  // The protocol in PythonEngineBridge implementation differs from the data model spec
  // TODO: Align message protocol between service and types
  /*
  private async handleSendMessage(_event: IpcMainInvokeEvent, message: any): Promise<any> {
    try {
      // Route the message to the appropriate bridge method based on type
      switch (message.type) {
        case 'start_animation':
          return await this.engineBridge.startAnimation(message.payload);
        case 'pause_animation':
          return await this.engineBridge.pauseAnimation();
        case 'resume_animation':
          return await this.engineBridge.resumeAnimation();
        case 'stop_animation':
          return await this.engineBridge.stopAnimation();
        case 'skip_to_final':
          return await this.engineBridge.skipToFinal();
        case 'update_settings':
          return await this.engineBridge.updateEngineSettings(message.payload);
        case 'load_image':
          return await this.engineBridge.loadImage(message.payload.path || message.payload.imagePath);
        case 'set_watermark':
          return await this.engineBridge.setWatermark(message.payload.watermark);
        default:
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Send message error:', error);
      throw new Error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  */

  // Utility Methods
  private broadcastToRenderers(channel: string, data: any): void {
    // Get all BrowserWindow instances and send to each
    const { BrowserWindow } = require('electron');
    const windows = BrowserWindow.getAllWindows();
    
    windows.forEach((window: any) => {
      if (!window.isDestroyed() && window.webContents) {
        window.webContents.send(channel, data);
      }
    });
  }

  // Cleanup method
  removeHandlers(): void {
    const handlerNames = [
      'engine:start',
      'engine:stop',
      'engine:restart',
      'engine:is-running',
      'engine:get-health',
      'engine:start-animation',
      'engine:pause-animation',
      'engine:resume-animation',
      'engine:stop-animation',
      'engine:skip-to-final',
      'engine:update-settings',
      'engine:load-image',
      'engine:set-watermark',
      'engine:send-message'
    ];

    handlerNames.forEach(name => {
      ipcMain.removeHandler(name);
    });

    // Remove engine event listeners
    this.engineBridge.removeAllListeners();
  }
}
