/**
 * Main Process Entry Point
 * Entry point for the Electron main process of the Point Shooting UI application
 */

import { app, BrowserWindow } from 'electron';
 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
// Import service managers and controllers
import { MainWindowController } from './MainWindowController';
import { SettingsManager } from './services/SettingsManager';
import { FileManager } from './services/FileManager';
import { PythonEngineBridge } from './services/PythonEngineBridge';

// Import IPC handlers
import { SettingsIpcHandlers } from './ipc/settings-handlers';
import { FileIpcHandlers } from './ipc/file-handlers';
import { EngineIpcHandlers } from './ipc/engine-handlers';
import { WindowIpcHandlers } from './ipc/window-handlers';

// Global application state
let mainWindowController: MainWindowController | null = null;
let settingsManager: SettingsManager | null = null;
let fileManager: FileManager | null = null;
let engineBridge: PythonEngineBridge | null = null;

// IPC handlers
let settingsIpcHandlers: SettingsIpcHandlers | null = null;
let fileIpcHandlers: FileIpcHandlers | null = null;
let engineIpcHandlers: EngineIpcHandlers | null = null;
let windowIpcHandlers: WindowIpcHandlers | null = null;

// Set application name
app.setName('Point Shooting');
// Note: app.setVersion() doesn't exist in Electron API, version comes from package.json

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  try {
    // Set app user model id for Windows
    electronApp.setAppUserModelId('com.point-shooting.ui');

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window);
    });

    // Initialize services
    await initializeServices();

    // Initialize IPC handlers
    initializeIpcHandlers();

    // Create main window
    await createWindow();

    // Handle app activation (macOS)
    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

    console.log('Point Shooting UI application started successfully');

  } catch (_error) {
    console.error('Failed to initialize application:', _error);
    app.quit();
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle app termination
app.on('before-quit', async (event) => {
  event.preventDefault();
  
  try {
    console.log('Application shutting down...');
    
    // Graceful shutdown of services
    await shutdownServices();
    
    // Cleanup IPC handlers
    cleanupIpcHandlers();
    
    console.log('Shutdown complete');
    app.exit(0);
    
  } catch (error) {
    console.error('Error during shutdown:', error);
    app.exit(1);
  }
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
  if (is.dev && url.startsWith('https://localhost')) {
    // In development, ignore certificate errors for localhost
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default verification
    callback(false);
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_event, contents) => {
  // @ts-expect-error - new-window event deprecated but still used
  contents.on('new-window', (event: any, navigationUrl: string) => {
    // Prevent opening new windows
    event.preventDefault();
    
    // Optionally open in external browser
    if (navigationUrl.startsWith('http')) {
      shell.openExternal(navigationUrl);
    }
  });
});

// Initialize core services
async function initializeServices(): Promise<void> {
  console.log('Initializing core services...');
  
  try {
    // Initialize in dependency order
    settingsManager = new SettingsManager();
    fileManager = new FileManager();
    engineBridge = new PythonEngineBridge();
    mainWindowController = new MainWindowController();
    
    console.log('Core services initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
}

// Initialize IPC handlers
function initializeIpcHandlers(): void {
  console.log('Initializing IPC handlers...');
  
  try {
    if (!settingsManager || !fileManager || !engineBridge) {
      throw new Error('Services not initialized');
    }
    
    settingsIpcHandlers = new SettingsIpcHandlers(settingsManager);
    fileIpcHandlers = new FileIpcHandlers(fileManager);
    engineIpcHandlers = new EngineIpcHandlers(engineBridge);
    windowIpcHandlers = new WindowIpcHandlers();
    
    console.log('IPC handlers initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize IPC handlers:', error);
    throw error;
  }
}

// Create main application window
async function createWindow(): Promise<void> {
  console.log('Creating main window...');
  
  try {
    if (!mainWindowController) {
      throw new Error('MainWindowController not initialized');
    }
    
    await mainWindowController.initializeWindow();
    console.log('Main window created successfully');
    
  } catch (error) {
    console.error('Failed to create main window:', error);
    throw error;
  }
}

// Graceful shutdown of services
async function shutdownServices(): Promise<void> {
  console.log('Shutting down services...');
  
  try {
    // Stop the Python engine first
    if (engineBridge) {
      await engineBridge.stopEngine();
      engineBridge.destroy();
      engineBridge = null;
    }
    
    // Cleanup file manager
    if (fileManager) {
      fileManager.destroy();
      fileManager = null;
    }
    
    // Close main window
    if (mainWindowController) {
      await mainWindowController.closeWindow();
      mainWindowController.destroy();
      mainWindowController = null;
    }
    
    // Settings manager cleanup (save any pending changes)
    if (settingsManager) {
      // Settings are automatically saved due to electron-store
      settingsManager = null;
    }
    
    console.log('Services shutdown complete');
    
  } catch (_error) {
    console.error('Error during service shutdown:', _error);
    // Continue with shutdown even if there are errors
  }
}

// Cleanup IPC handlers
function cleanupIpcHandlers(): void {
  console.log('Cleaning up IPC handlers...');
  
  try {
    if (settingsIpcHandlers) {
      settingsIpcHandlers.removeHandlers();
      settingsIpcHandlers = null;
    }
    
    if (fileIpcHandlers) {
      fileIpcHandlers.removeHandlers();
      fileIpcHandlers = null;
    }
    
    if (engineIpcHandlers) {
      engineIpcHandlers.removeHandlers();
      engineIpcHandlers = null;
    }
    
    if (windowIpcHandlers) {
      windowIpcHandlers.removeHandlers();
      windowIpcHandlers = null;
    }
    
    console.log('IPC handlers cleanup complete');
    
  } catch (_error) {
    console.error('Error during IPC cleanup:', _error);
    // Continue with shutdown
  }
}

// Development mode utilities
if (is.dev) {
  // Enable live reload for Electron in development
  require('electron-reload')(__dirname, {
    electron: require(`${__dirname}/../../node_modules/electron/dist/electron`),
    hardResetMethod: 'exit'
  });
}

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  // Try to show error dialog if possible
  try {
    const { dialog } = require('electron');
    dialog.showErrorBox('Unexpected Error', 
      `An unexpected error occurred:\n\n${error.message}\n\nThe application will now exit.`);
  } catch {
    // If dialog fails, just log
    console.error('Failed to show error dialog');
  }
  
  // Force exit after showing error
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Log but don't exit for unhandled promise rejections
  // These might be recoverable
});

// Export for testing purposes
export {
  mainWindowController,
  settingsManager,
  fileManager,
  engineBridge
};
