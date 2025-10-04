/**
 * Type definitions for Electron API exposed to renderer process
 * Extends the Window interface with electronAPI from preload script
 */

// Electron API interface that matches the preload script
interface ElectronAPI {
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
    updateNotificationSettings(settings: any): Promise<void>;
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
    showSystemNotification(notification: any): Promise<void>;
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

// Development tools interface (only available in development)
interface DevTools {
  getProcessInfo(): any;
  logToMain(message: string): void;
}

// Extend the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    devTools?: DevTools;
  }
}

// Export the interfaces for use in other files
export type { ElectronAPI, DevTools };
