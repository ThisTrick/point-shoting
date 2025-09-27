/**
 * Window Management IPC Handlers
 * IPC handlers for window operations and UI state management
 */

import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
import { UISettings } from '../../types';

// Temporary type definitions until properly defined in types module
interface WindowBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

interface ApplicationState {
  isEngineRunning: boolean;
  currentAnimation: any | null;
  loadedImage: any | null;
  notifications: NotificationMessage[];
  debugMode: boolean;
}

interface NotificationMessage {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  persistent: boolean;
  actions?: NotificationAction[];
}

interface NotificationAction {
  label: string;
  action: string;
}

interface WindowState {
  bounds: WindowBounds;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  isFocused: boolean;
}

export class WindowIpcHandlers {
  private applicationState: ApplicationState = {
    isEngineRunning: false,
    currentAnimation: null,
    loadedImage: null,
    notifications: [],
    debugMode: process.env.NODE_ENV === 'development'
  };

  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Window Control Operations
    ipcMain.handle('window:minimize', this.handleMinimizeWindow.bind(this));
    ipcMain.handle('window:maximize', this.handleMaximizeWindow.bind(this));
    ipcMain.handle('window:restore', this.handleRestoreWindow.bind(this));
    ipcMain.handle('window:close', this.handleCloseWindow.bind(this));
    ipcMain.handle('window:hide', this.handleHideWindow.bind(this));
    ipcMain.handle('window:show', this.handleShowWindow.bind(this));

    // Window State Management
    ipcMain.handle('window:get-bounds', this.handleGetWindowBounds.bind(this));
    ipcMain.handle('window:set-bounds', this.handleSetWindowBounds.bind(this));
    ipcMain.handle('window:get-state', this.handleGetWindowState.bind(this));
    ipcMain.handle('window:center', this.handleCenterWindow.bind(this));

    // Window Focus and Visibility
    ipcMain.handle('window:focus', this.handleFocusWindow.bind(this));
    ipcMain.handle('window:blur', this.handleBlurWindow.bind(this));
    ipcMain.handle('window:is-focused', this.handleIsWindowFocused.bind(this));
    ipcMain.handle('window:is-visible', this.handleIsWindowVisible.bind(this));

    // Fullscreen and Display
    ipcMain.handle('window:toggle-fullscreen', this.handleToggleFullscreen.bind(this));
    ipcMain.handle('window:is-fullscreen', this.handleIsFullscreen.bind(this));
    ipcMain.handle('window:set-always-on-top', this.handleSetAlwaysOnTop.bind(this));

    // Application State Management  
    ipcMain.handle('app:get-state', this.handleGetApplicationState.bind(this));
    ipcMain.handle('app:update-state', this.handleUpdateApplicationState.bind(this));

    // Notification Management
    ipcMain.handle('notifications:add', this.handleAddNotification.bind(this));
    ipcMain.handle('notifications:remove', this.handleRemoveNotification.bind(this));
    ipcMain.handle('notifications:clear', this.handleClearNotifications.bind(this));
    ipcMain.handle('notifications:get-all', this.handleGetNotifications.bind(this));

    // UI Mode and Theme
    ipcMain.handle('ui:toggle-debug-mode', this.handleToggleDebugMode.bind(this));
    ipcMain.handle('ui:is-debug-mode', this.handleIsDebugMode.bind(this));
    ipcMain.handle('ui:reload', this.handleReloadUI.bind(this));
    ipcMain.handle('ui:toggle-dev-tools', this.handleToggleDevTools.bind(this));
  }

  // Window Control Operations
  private async handleMinimizeWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.minimize();
      }
    } catch (error) {
      console.error('Minimize window error:', error);
      throw new Error(`Failed to minimize window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleMaximizeWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        if (window.isMaximized()) {
          window.unmaximize();
        } else {
          window.maximize();
        }
      }
    } catch (error) {
      console.error('Maximize window error:', error);
      throw new Error(`Failed to maximize window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleRestoreWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        if (window.isMinimized()) {
          window.restore();
        } else if (window.isMaximized()) {
          window.unmaximize();
        }
      }
    } catch (error) {
      console.error('Restore window error:', error);
      throw new Error(`Failed to restore window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleCloseWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.close();
      }
    } catch (error) {
      console.error('Close window error:', error);
      throw new Error(`Failed to close window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleHideWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.hide();
      }
    } catch (error) {
      console.error('Hide window error:', error);
      throw new Error(`Failed to hide window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleShowWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.show();
      }
    } catch (error) {
      console.error('Show window error:', error);
      throw new Error(`Failed to show window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Window State Management
  private async handleGetWindowBounds(event: IpcMainInvokeEvent): Promise<WindowBounds | null> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        return window.getBounds();
      }
      return null;
    } catch (error) {
      console.error('Get window bounds error:', error);
      throw new Error(`Failed to get window bounds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleSetWindowBounds(event: IpcMainInvokeEvent, bounds: WindowBounds): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.setBounds(bounds);
      }
    } catch (error) {
      console.error('Set window bounds error:', error);
      throw new Error(`Failed to set window bounds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetWindowState(event: IpcMainInvokeEvent): Promise<WindowState | null> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        return {
          bounds: window.getBounds(),
          isMaximized: window.isMaximized(),
          isMinimized: window.isMinimized(),
          isFullscreen: window.isFullScreen(),
          isFocused: window.isFocused()
        };
      }
      return null;
    } catch (error) {
      console.error('Get window state error:', error);
      throw new Error(`Failed to get window state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleCenterWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.center();
      }
    } catch (error) {
      console.error('Center window error:', error);
      throw new Error(`Failed to center window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Window Focus and Visibility
  private async handleFocusWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.focus();
      }
    } catch (error) {
      console.error('Focus window error:', error);
      throw new Error(`Failed to focus window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleBlurWindow(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.blur();
      }
    } catch (error) {
      console.error('Blur window error:', error);
      throw new Error(`Failed to blur window: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleIsWindowFocused(event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      return window ? window.isFocused() : false;
    } catch (error) {
      console.error('Is window focused error:', error);
      return false;
    }
  }

  private async handleIsWindowVisible(event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      return window ? window.isVisible() : false;
    } catch (error) {
      console.error('Is window visible error:', error);
      return false;
    }
  }

  // Fullscreen and Display
  private async handleToggleFullscreen(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.setFullScreen(!window.isFullScreen());
      }
    } catch (error) {
      console.error('Toggle fullscreen error:', error);
      throw new Error(`Failed to toggle fullscreen: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleIsFullscreen(event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      return window ? window.isFullScreen() : false;
    } catch (error) {
      console.error('Is fullscreen error:', error);
      return false;
    }
  }

  private async handleSetAlwaysOnTop(event: IpcMainInvokeEvent, alwaysOnTop: boolean): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.setAlwaysOnTop(alwaysOnTop);
      }
    } catch (error) {
      console.error('Set always on top error:', error);
      throw new Error(`Failed to set always on top: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Application State Management
  private async handleGetApplicationState(_event: IpcMainInvokeEvent): Promise<ApplicationState> {
    return { ...this.applicationState };
  }

  private async handleUpdateApplicationState(_event: IpcMainInvokeEvent, updates: Partial<ApplicationState>): Promise<void> {
    try {
      this.applicationState = { ...this.applicationState, ...updates };
      
      // Broadcast state update to all windows
      this.broadcastToAllWindows('app:state-updated', this.applicationState);
    } catch (error) {
      console.error('Update application state error:', error);
      throw new Error(`Failed to update application state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Notification Management
  private async handleAddNotification(_event: IpcMainInvokeEvent, notification: NotificationMessage): Promise<void> {
    try {
      this.applicationState.notifications.push(notification);
      this.broadcastToAllWindows('notification:added', notification);
    } catch (error) {
      console.error('Add notification error:', error);
      throw new Error(`Failed to add notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleRemoveNotification(_event: IpcMainInvokeEvent, notificationId: string): Promise<void> {
    try {
      this.applicationState.notifications = this.applicationState.notifications.filter(
        n => n.id !== notificationId
      );
      this.broadcastToAllWindows('notification:removed', notificationId);
    } catch (error) {
      console.error('Remove notification error:', error);
      throw new Error(`Failed to remove notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleClearNotifications(_event: IpcMainInvokeEvent): Promise<void> {
    try {
      this.applicationState.notifications = [];
      this.broadcastToAllWindows('notifications:cleared');
    } catch (error) {
      console.error('Clear notifications error:', error);
      throw new Error(`Failed to clear notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetNotifications(_event: IpcMainInvokeEvent): Promise<NotificationMessage[]> {
    return [...this.applicationState.notifications];
  }

  // UI Mode and Theme
  private async handleToggleDebugMode(_event: IpcMainInvokeEvent): Promise<boolean> {
    try {
      this.applicationState.debugMode = !this.applicationState.debugMode;
      this.broadcastToAllWindows('debug-mode:toggled', this.applicationState.debugMode);
      return this.applicationState.debugMode;
    } catch (error) {
      console.error('Toggle debug mode error:', error);
      throw new Error(`Failed to toggle debug mode: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleIsDebugMode(_event: IpcMainInvokeEvent): Promise<boolean> {
    return this.applicationState.debugMode;
  }

  private async handleReloadUI(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.webContents.reload();
      }
    } catch (error) {
      console.error('Reload UI error:', error);
      throw new Error(`Failed to reload UI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleToggleDevTools(event: IpcMainInvokeEvent): Promise<void> {
    try {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        window.webContents.toggleDevTools();
      }
    } catch (error) {
      console.error('Toggle dev tools error:', error);
      throw new Error(`Failed to toggle dev tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility Methods
  private broadcastToAllWindows(channel: string, data?: any): void {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((window: BrowserWindow) => {
      if (!window.isDestroyed() && window.webContents) {
        window.webContents.send(channel, data);
      }
    });
  }

  // Update application state from external sources
  updateApplicationState(updates: Partial<ApplicationState>): void {
    this.applicationState = { ...this.applicationState, ...updates };
    this.broadcastToAllWindows('app:state-updated', this.applicationState);
  }

  // Add notification from external sources
  addNotification(notification: NotificationMessage): void {
    this.applicationState.notifications.push(notification);
    this.broadcastToAllWindows('notification:added', notification);
  }

  // Get current application state (for external access)
  getApplicationState(): ApplicationState {
    return { ...this.applicationState };
  }

  // Cleanup method
  removeHandlers(): void {
    const handlerNames = [
      'window:minimize',
      'window:maximize',
      'window:restore',
      'window:close',
      'window:hide',
      'window:show',
      'window:get-bounds',
      'window:set-bounds',
      'window:get-state',
      'window:center',
      'window:focus',
      'window:blur',
      'window:is-focused',
      'window:is-visible',
      'window:toggle-fullscreen',
      'window:is-fullscreen',
      'window:set-always-on-top',
      'app:get-state',
      'app:update-state',
      'notifications:add',
      'notifications:remove',
      'notifications:clear',
      'notifications:get-all',
      'ui:toggle-debug-mode',
      'ui:is-debug-mode',
      'ui:reload',
      'ui:toggle-dev-tools'
    ];

    handlerNames.forEach(name => {
      ipcMain.removeHandler(name);
    });
  }
}
