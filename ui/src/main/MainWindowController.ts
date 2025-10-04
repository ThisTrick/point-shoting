/**
 * MainWindowController Implementation
 * Головне вікно Electron app з координацією UI компонентів та IPC communication
 */

import { BrowserWindow, app, Menu, shell } from 'electron';
import path from 'path';
import { EventEmitter } from 'events';
import { SettingsManager } from './services/SettingsManager';
import { FileManager } from './services/FileManager';
import { PythonEngineBridge } from './services/PythonEngineBridge';
import type {
  ApplicationState,
  UISettings,
  NotificationMessage,
  OutgoingMessage,
  IncomingMessage,
  EngineStatus,
  EngineMetrics,
  EngineError
} from '@shared/types';

export class MainWindowController extends EventEmitter {
  private mainWindow: BrowserWindow | null = null;
  private settingsManager: SettingsManager;
  private fileManager: FileManager;
  private engineBridge: PythonEngineBridge;
  private applicationState: ApplicationState;

  constructor() {
    super();
    
    this.settingsManager = new SettingsManager();
    this.fileManager = new FileManager();
    this.engineBridge = new PythonEngineBridge();
    
    this.applicationState = {
      isEngineRunning: false,
      currentAnimation: null,
      loadedImage: null,
      notifications: [],
      debugMode: process.env.NODE_ENV === 'development'
    };

    this.setupEventHandlers();
  }

  // Window Management
  async initializeWindow(): Promise<void> {
    try {
      // Load settings first
      const settings = await this.loadSettings();
      
      // Get window bounds with defaults
      const bounds = settings.windowBounds || { width: 1200, height: 800 };
      
      // Create the browser window
      this.mainWindow = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        minWidth: 800,
        minHeight: 600,
        show: false, // Don't show until ready
        icon: path.join(__dirname, '../../assets/icon.png'),
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
        }
      });

      // Set up window event handlers
      this.setupWindowEventHandlers();

      // NOTE: IPC handlers are registered in main.ts via separate handler classes
      // (SettingsIpcHandlers, FileIpcHandlers, EngineIpcHandlers, WindowIpcHandlers)
      // Do NOT call setupIpcHandlers() here to avoid duplicate registration

      // Load the renderer HTML
      if (process.env.NODE_ENV === 'development') {
        // Development mode - load from Vite dev server
        await this.mainWindow.loadURL('http://localhost:5173');
        this.mainWindow.webContents.openDevTools();
      } else {
        // Production mode - load built files (Vite preserves input structure)
        await this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
      }

      // Set up application menu
      this.setupApplicationMenu();

      console.log('Main window initialized successfully');

    } catch (error) {
      console.error('Failed to initialize main window:', error);
      throw error;
    }
  }

  showWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  hideWindow(): void {
    if (this.mainWindow) {
      this.mainWindow.hide();
    }
  }

  async closeWindow(): Promise<void> {
    try {
      // Save current window bounds
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        const bounds = this.mainWindow.getBounds();
        const settings = this.settingsManager.getCurrentSettings();
        
        await this.settingsManager.updateSettings({
          ...settings,
          windowBounds: bounds
        });
      }

      // Gracefully stop the Python engine
      if (this.applicationState.isEngineRunning) {
        await this.stopEngine();
      }

      // Clean up services
      this.fileManager.destroy();
      this.engineBridge.destroy();

      // Close the window
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.close();
      }

      console.log('Main window closed successfully');

    } catch (error) {
      console.error('Error during window close:', error);
      
      // Force close if graceful close fails
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.destroy();
      }
    }
  }

  // Application State
  getApplicationState(): ApplicationState {
    return { ...this.applicationState };
  }

  updateApplicationState(state: Partial<ApplicationState>): void {
    this.applicationState = { ...this.applicationState, ...state };
    
    // Notify renderer process of state change
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('application-state-updated', this.applicationState);
    }

    this.emit('stateUpdated', this.applicationState);
  }

  // Settings Management
  async loadSettings(): Promise<UISettings> {
    try {
      return this.settingsManager.getCurrentSettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      throw error;
    }
  }

  async saveSettings(settings: UISettings): Promise<void> {
    try {
      await this.settingsManager.updateSettings(settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async resetSettings(): Promise<void> {
    try {
      await this.settingsManager.resetToDefaults();
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  // Python Engine Communication
  async startEngine(): Promise<boolean> {
    try {
      const result = await this.engineBridge.startEngine();
      
      if (result.success) {
        this.updateApplicationState({ isEngineRunning: true });
        console.log(`Engine started successfully (PID: ${result.processId})`);
      } else {
        console.error('Engine failed to start:', result.error);
        this.addNotification({
          id: `engine-start-error-${Date.now()}`,
          type: 'error',
          title: 'Engine Startup Failed',
          message: result.error || 'Unknown error during engine startup',
          timestamp: Date.now(),
          autoClose: false,
          persistent: false
        });
      }

      return result.success;

    } catch (error) {
      console.error('Failed to start engine:', error);
      this.updateApplicationState({ isEngineRunning: false });
      return false;
    }
  }

  async stopEngine(): Promise<void> {
    try {
      await this.engineBridge.stopEngine();
      this.updateApplicationState({ 
        isEngineRunning: false,
        currentAnimation: null
      });
      console.log('Engine stopped successfully');

    } catch (error) {
      console.error('Failed to stop engine:', error);
      throw error;
    }
  }

  async sendEngineCommand(command: OutgoingMessage): Promise<void> {
    try {
      if (!this.applicationState.isEngineRunning) {
        throw new Error('Engine is not running');
      }

      // Route command to appropriate bridge method
      switch (command.type) {
        case 'start_animation':
          await this.engineBridge.startAnimation(command.payload);
          break;
        case 'pause_animation':
          await this.engineBridge.pauseAnimation();
          break;
        case 'resume_animation':
          await this.engineBridge.resumeAnimation();
          break;
        case 'stop_animation':
          await this.engineBridge.stopAnimation();
          break;
        case 'skip_to_final':
          await this.engineBridge.skipToFinal();
          break;
        case 'update_settings':
          await this.engineBridge.updateEngineSettings(command.payload);
          break;
        case 'load_image':
          if (command.payload?.imagePath) {
            await this.engineBridge.loadImage(command.payload.imagePath);
          }
          break;
        case 'set_watermark':
          if (command.payload?.watermark !== undefined) {
            await this.engineBridge.setWatermark(command.payload.watermark);
          }
          break;
        default:
          console.warn('Unknown engine command:', command.type);
      }

    } catch (error) {
      console.error('Failed to send engine command:', error);
      throw error;
    }
  }

  // Event Handling
  onEngineMessage(handler: (message: IncomingMessage) => void): void {
    this.engineBridge.on('message', handler);
  }

  onSettingsChanged(handler: (settings: UISettings) => void): void {
    this.settingsManager.onSettingsChanged(handler);
  }

  // Private Methods
  private setupEventHandlers(): void {
    // Engine status updates
    this.engineBridge.onStatusUpdate((status: EngineStatus) => {
      this.updateApplicationState({
        currentAnimation: {
          ...status,
          sourceImage: this.applicationState.loadedImage,
          watermark: undefined, // TODO: Track watermark state
          error: undefined,
          lastErrorTimestamp: undefined
        }
      });

      // Send to renderer
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('engine-status-update', status);
      }
    });

    // Engine metrics updates
    this.engineBridge.onMetricsUpdate((metrics: EngineMetrics) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('engine-metrics-update', metrics);
      }
    });

    // Engine errors
    this.engineBridge.onError((error: EngineError) => {
      console.error('Engine error:', error);
      
      this.addNotification({
        id: `engine-error-${Date.now()}`,
        type: 'error',
        title: 'Engine Error',
        message: error.message,
        timestamp: Date.now(),
        autoClose: false,
        persistent: true
      });

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('engine-error', error);
      }
    });

    // Settings changes
    this.settingsManager.onSettingsChanged((settings: UISettings) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('settings-updated', settings);
      }
    });

    // File manager events
    this.fileManager.on('recentFilesUpdated', (files) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('recent-files-updated', files);
      }
    });
  }

  private setupWindowEventHandlers(): void {
    if (!this.mainWindow) return;

    this.mainWindow.on('ready-to-show', () => {
      this.showWindow();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.on('focus', () => {
      this.emit('windowEvent', 'focus');
    });

    this.mainWindow.on('blur', () => {
      this.emit('windowEvent', 'blur');
    });

    this.mainWindow.on('maximize', () => {
      this.emit('windowEvent', 'maximize');
    });

    this.mainWindow.on('unmaximize', () => {
      this.emit('windowEvent', 'unmaximize');
    });

    this.mainWindow.on('resize', () => {
      this.emit('windowEvent', 'resize');
    });

    this.mainWindow.on('move', () => {
      this.emit('windowEvent', 'move');
    });

    // Handle external links
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
  }

  // IPC handlers are registered in main.ts via separate handler classes
  // (SettingsIpcHandlers, FileIpcHandlers, EngineIpcHandlers, WindowIpcHandlers)

  private setupApplicationMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Open Image',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const result = await this.fileManager.selectImageFile();
              if (result && this.mainWindow) {
                this.mainWindow.webContents.send('image-selected', result);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Engine',
        submenu: [
          {
            label: 'Start Engine',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => {
              this.startEngine();
            }
          },
          {
            label: 'Stop Engine',
            accelerator: 'CmdOrCtrl+Shift+T',
            click: () => {
              this.stopEngine();
            }
          },
          { type: 'separator' },
          {
            label: 'Restart Engine',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: async () => {
              await this.stopEngine();
              await this.startEngine();
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services', submenu: [] },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private addNotification(notification: NotificationMessage): void {
    const notifications = this.applicationState.notifications || [];
    this.updateApplicationState({
      ...this.applicationState,
      notifications: [...notifications, notification]
    });

    // Send to renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('notification-added', notification);
    }
  }

  // Cleanup method
  destroy(): void {
    this.fileManager.destroy();
    this.engineBridge.destroy();
    this.removeAllListeners();
  }
}
