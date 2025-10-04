/**
 * Preload Script with Context Bridge
 * Exposes secure IPC communication APIs to the renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

// Temporary type definitions for better TypeScript support
interface IpcApi {
  // Settings API
  settings: {
    get(): Promise<any>;
    update(settings: any): Promise<void>;
    reset(): Promise<void>;
    validate(settings: any): Promise<any>;
    load(): Promise<any>;
    save(settings: any): Promise<void>;
    export(filePath: string, settings?: any): Promise<void>;
    import(filePath: string): Promise<any>;
    savePreset(name: string, description?: string): Promise<void>;
    loadPreset(presetId: string): Promise<any>;
    deletePreset(presetId: string): Promise<void>;
    listPresets(): Promise<any[]>;
    applyTheme(theme: 'light' | 'dark' | 'system'): Promise<void>;
    getTheme(): Promise<'light' | 'dark' | 'system'>;
    setLanguage(language: 'uk' | 'en'): Promise<void>;
    getLanguage(): Promise<'uk' | 'en'>;
    onChanged(callback: (settings: any) => void): () => void;
  };

  // File API
  files: {
    selectImage(): Promise<any | null>;
    validateImage(filePath: string): Promise<any>;
    generatePreview(filePath: string, maxSize?: number): Promise<string>;
    getImageMetadata(filePath: string): Promise<any>;
    selectConfig(mode: 'import' | 'export'): Promise<string | null>;
    saveConfig(filePath: string, config: any): Promise<void>;
    loadConfig(filePath: string): Promise<any>;
    validateConfig(filePath: string): Promise<any>;
    selectWatermark(): Promise<any | null>;
    validateWatermark(filePath: string): Promise<any>;
    getRecentImages(): Promise<any[]>;
    addRecentImage(filePath: string): Promise<void>;
    removeRecentImage(filePath: string): Promise<void>;
    clearRecentImages(): Promise<void>;
    getFileStats(filePath: string): Promise<any>;
    fileExists(filePath: string): Promise<boolean>;
    watchFile(filePath: string): Promise<string>;
    unwatchFile(watcherId: string): Promise<void>;
  };

  // Engine API
  engine: {
    start(): Promise<any>;
    stop(): Promise<void>;
    restart(): Promise<any>;
    isRunning(): Promise<boolean>;
    getHealth(): Promise<any>;
    startAnimation(config: any): Promise<void>;
    pauseAnimation(): Promise<void>;
    resumeAnimation(): Promise<void>;
    stopAnimation(): Promise<void>;
    skipToFinal(): Promise<void>;
    updateSettings(settings: any): Promise<void>;
    loadImage(imagePath: string): Promise<any>;
    setWatermark(watermark: any | null): Promise<void>;
    sendMessage(message: any): Promise<any>;
    onStatusUpdate(callback: (status: any) => void): () => void;
    onStageChange(callback: (stage: any) => void): () => void;
    onError(callback: (error: any) => void): () => void;
    onMetricsUpdate(callback: (metrics: any) => void): () => void;
  };

  // Window API
  window: {
    minimize(): Promise<void>;
    maximize(): Promise<void>;
    restore(): Promise<void>;
    close(): Promise<void>;
    hide(): Promise<void>;
    show(): Promise<void>;
    getBounds(): Promise<any | null>;
    setBounds(bounds: any): Promise<void>;
    getState(): Promise<any | null>;
    center(): Promise<void>;
    focus(): Promise<void>;
    blur(): Promise<void>;
    isFocused(): Promise<boolean>;
    isVisible(): Promise<boolean>;
    toggleFullscreen(): Promise<void>;
    isFullscreen(): Promise<boolean>;
    setAlwaysOnTop(alwaysOnTop: boolean): Promise<void>;
  };

  // Application API
  app: {
    getState(): Promise<any>;
    updateState(updates: any): Promise<void>;
    onStateUpdated(callback: (state: any) => void): () => void;
  };

  // Notifications API
  notifications: {
    add(notification: any): Promise<void>;
    remove(notificationId: string): Promise<void>;
    clear(): Promise<void>;
    getAll(): Promise<any[]>;
    onAdded(callback: (notification: any) => void): () => void;
    onRemoved(callback: (notificationId: string) => void): () => void;
    onCleared(callback: () => void): () => void;
  };

  // UI API
  ui: {
    toggleDebugMode(): Promise<boolean>;
    isDebugMode(): Promise<boolean>;
    reload(): Promise<void>;
    toggleDevTools(): Promise<void>;
    onThemeChanged(callback: (theme: string) => void): () => void;
    onLanguageChanged(callback: (language: string) => void): () => void;
  };
}

// Check that we are running in a secure context
if (process.contextIsolated) {
  try {
    // Expose protected methods that allow the renderer process to use
    // the ipcRenderer without exposing the entire object
    const api: IpcApi = {
      // Settings API
      settings: {
        get: () => ipcRenderer.invoke('settings:get'),
        update: (settings) => ipcRenderer.invoke('settings:update', settings),
        reset: () => ipcRenderer.invoke('settings:reset'),
        validate: (settings) => ipcRenderer.invoke('settings:validate', settings),
        load: () => ipcRenderer.invoke('settings:load'),
        save: (settings) => ipcRenderer.invoke('settings:save', settings),
        export: (filePath, settings) => ipcRenderer.invoke('settings:export', filePath, settings),
        import: (filePath) => ipcRenderer.invoke('settings:import', filePath),
        savePreset: (name, description) => ipcRenderer.invoke('settings:save-preset', name, description),
        loadPreset: (presetId) => ipcRenderer.invoke('settings:load-preset', presetId),
        deletePreset: (presetId) => ipcRenderer.invoke('settings:delete-preset', presetId),
        listPresets: () => ipcRenderer.invoke('settings:list-presets'),
        applyTheme: (theme) => ipcRenderer.invoke('settings:apply-theme', theme),
        getTheme: () => ipcRenderer.invoke('settings:get-theme'),
        setLanguage: (language) => ipcRenderer.invoke('settings:set-language', language),
        getLanguage: () => ipcRenderer.invoke('settings:get-language'),
        onChanged: (callback) => {
          const listener = (_: any, settings: any) => callback(settings);
          ipcRenderer.on('settings-updated', listener);
          return () => ipcRenderer.removeListener('settings-updated', listener);
        }
      },

      // File API
      files: {
        selectImage: () => ipcRenderer.invoke('files:select-image'),
        validateImage: (filePath) => ipcRenderer.invoke('files:validate-image', filePath),
        generatePreview: (filePath, maxSize) => ipcRenderer.invoke('files:generate-preview', filePath, maxSize),
        getImageMetadata: (filePath) => ipcRenderer.invoke('files:get-image-metadata', filePath),
        selectConfig: (mode) => ipcRenderer.invoke('files:select-config', mode),
        saveConfig: (filePath, config) => ipcRenderer.invoke('files:save-config', filePath, config),
        loadConfig: (filePath) => ipcRenderer.invoke('files:load-config', filePath),
        validateConfig: (filePath) => ipcRenderer.invoke('files:validate-config', filePath),
        selectWatermark: () => ipcRenderer.invoke('files:select-watermark'),
        validateWatermark: (filePath) => ipcRenderer.invoke('files:validate-watermark', filePath),
        getRecentImages: () => ipcRenderer.invoke('files:get-recent-images'),
        addRecentImage: (filePath) => ipcRenderer.invoke('files:add-recent-image', filePath),
        removeRecentImage: (filePath) => ipcRenderer.invoke('files:remove-recent-image', filePath),
        clearRecentImages: () => ipcRenderer.invoke('files:clear-recent-images'),
        getFileStats: (filePath) => ipcRenderer.invoke('files:get-file-stats', filePath),
        fileExists: (filePath) => ipcRenderer.invoke('files:file-exists', filePath),
        watchFile: (filePath) => ipcRenderer.invoke('files:watch-file', filePath),
        unwatchFile: (watcherId) => ipcRenderer.invoke('files:unwatch-file', watcherId)
      },

      // Engine API
      engine: {
        start: () => ipcRenderer.invoke('engine:start'),
        stop: () => ipcRenderer.invoke('engine:stop'),
        restart: () => ipcRenderer.invoke('engine:restart'),
        isRunning: () => ipcRenderer.invoke('engine:is-running'),
        getHealth: () => ipcRenderer.invoke('engine:get-health'),
        startAnimation: (config) => ipcRenderer.invoke('engine:start-animation', config),
        pauseAnimation: () => ipcRenderer.invoke('engine:pause-animation'),
        resumeAnimation: () => ipcRenderer.invoke('engine:resume-animation'),
        stopAnimation: () => ipcRenderer.invoke('engine:stop-animation'),
        skipToFinal: () => ipcRenderer.invoke('engine:skip-to-final'),
        updateSettings: (settings) => ipcRenderer.invoke('engine:update-settings', settings),
        loadImage: (imagePath) => ipcRenderer.invoke('engine:load-image', imagePath),
        setWatermark: (watermark) => ipcRenderer.invoke('engine:set-watermark', watermark),
        sendMessage: (message) => ipcRenderer.invoke('engine:send-message', message),
        onStatusUpdate: (callback) => {
          const listener = (_: any, status: any) => callback(status);
          ipcRenderer.on('engine:status-update', listener);
          return () => ipcRenderer.removeListener('engine:status-update', listener);
        },
        onStageChange: (callback) => {
          const listener = (_: any, stage: any) => callback(stage);
          ipcRenderer.on('engine:stage-change', listener);
          return () => ipcRenderer.removeListener('engine:stage-change', listener);
        },
        onError: (callback) => {
          const listener = (_: any, error: any) => callback(error);
          ipcRenderer.on('engine:error', listener);
          return () => ipcRenderer.removeListener('engine:error', listener);
        },
        onMetricsUpdate: (callback) => {
          const listener = (_: any, metrics: any) => callback(metrics);
          ipcRenderer.on('engine:metrics-update', listener);
          return () => ipcRenderer.removeListener('engine:metrics-update', listener);
        }
      },

      // Window API
      window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        restore: () => ipcRenderer.invoke('window:restore'),
        close: () => ipcRenderer.invoke('window:close'),
        hide: () => ipcRenderer.invoke('window:hide'),
        show: () => ipcRenderer.invoke('window:show'),
        getBounds: () => ipcRenderer.invoke('window:get-bounds'),
        setBounds: (bounds) => ipcRenderer.invoke('window:set-bounds', bounds),
        getState: () => ipcRenderer.invoke('window:get-state'),
        center: () => ipcRenderer.invoke('window:center'),
        focus: () => ipcRenderer.invoke('window:focus'),
        blur: () => ipcRenderer.invoke('window:blur'),
        isFocused: () => ipcRenderer.invoke('window:is-focused'),
        isVisible: () => ipcRenderer.invoke('window:is-visible'),
        toggleFullscreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
        isFullscreen: () => ipcRenderer.invoke('window:is-fullscreen'),
        setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.invoke('window:set-always-on-top', alwaysOnTop)
      },

      // Application API
      app: {
        getState: () => ipcRenderer.invoke('app:get-state'),
        updateState: (updates) => ipcRenderer.invoke('app:update-state', updates),
        onStateUpdated: (callback) => {
          const listener = (_: any, state: any) => callback(state);
          ipcRenderer.on('app:state-updated', listener);
          return () => ipcRenderer.removeListener('app:state-updated', listener);
        }
      },

      // Notifications API
      notifications: {
        add: (notification) => ipcRenderer.invoke('notifications:add', notification),
        remove: (notificationId) => ipcRenderer.invoke('notifications:remove', notificationId),
        clear: () => ipcRenderer.invoke('notifications:clear'),
        getAll: () => ipcRenderer.invoke('notifications:get-all'),
        onAdded: (callback) => {
          const listener = (_: any, notification: any) => callback(notification);
          ipcRenderer.on('notification:added', listener);
          return () => ipcRenderer.removeListener('notification:added', listener);
        },
        onRemoved: (callback) => {
          const listener = (_: any, notificationId: string) => callback(notificationId);
          ipcRenderer.on('notification:removed', listener);
          return () => ipcRenderer.removeListener('notification:removed', listener);
        },
        onCleared: (callback) => {
          const listener = () => callback();
          ipcRenderer.on('notifications:cleared', listener);
          return () => ipcRenderer.removeListener('notifications:cleared', listener);
        }
      },

      // UI API
      ui: {
        toggleDebugMode: () => ipcRenderer.invoke('ui:toggle-debug-mode'),
        isDebugMode: () => ipcRenderer.invoke('ui:is-debug-mode'),
        reload: () => ipcRenderer.invoke('ui:reload'),
        toggleDevTools: () => ipcRenderer.invoke('ui:toggle-dev-tools'),
        onThemeChanged: (callback) => {
          const listener = (_: any, theme: string) => callback(theme);
          ipcRenderer.on('theme-changed', listener);
          return () => ipcRenderer.removeListener('theme-changed', listener);
        },
        onLanguageChanged: (callback) => {
          const listener = (_: any, language: string) => callback(language);
          ipcRenderer.on('language-changed', listener);
          return () => ipcRenderer.removeListener('language-changed', listener);
        }
      }
    };

    contextBridge.exposeInMainWorld('electronAPI', api);
    console.log('Context bridge API exposed successfully');

  } catch (error) {
    console.error('Failed to expose context bridge API:', error);
  }
} else {
  // Fallback for non-isolated contexts (not recommended for production)
  console.warn('Context isolation is disabled. This is not recommended for security.');
  
  // In non-isolated context, we can directly assign to window
  (window as any).electronAPI = {
    // Simplified fallback API - not recommended
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, callback: (...args: any[]) => void) => {
      const listener = (_: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, listener);
      return () => ipcRenderer.removeListener(channel, listener);
    }
  };
}

// Development mode enhancements
if (process.env.NODE_ENV === 'development') {
  // Expose additional debugging utilities in development
  contextBridge.exposeInMainWorld('devTools', {
    getProcessInfo: () => ({
      versions: process.versions,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    }),
    logToMain: (message: string) => {
      console.log('[Renderer]', message);
    }
  });
}

// Handle page load completion
window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script: DOM content loaded');
  
  // Notify main process that renderer is ready
  ipcRenderer.send('renderer-ready');
});

// Handle unhandled errors in renderer
window.addEventListener('error', (event) => {
  console.error('Renderer error:', event.error);
  ipcRenderer.send('renderer-error', {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Handle unhandled promise rejections in renderer
window.addEventListener('unhandledrejection', (event) => {
  console.error('Renderer unhandled rejection:', event.reason);
  ipcRenderer.send('renderer-unhandled-rejection', {
    reason: event.reason,
    stack: event.reason?.stack
  });
});
