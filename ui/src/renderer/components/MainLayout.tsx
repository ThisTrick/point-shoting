/**
 * MainLayout Component
 * Primary application layout with header, sidebar, main content, and footer
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAnimationState } from '../hooks/useAnimationState';
import { useNotifications } from '../contexts/NotificationContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ShortcutsHelpOverlay } from './utils/ShortcutsHelpOverlay';
import './MainLayout.css';

// Layout types
interface MainLayoutProps {
  children?: React.ReactNode;
}

interface LayoutState {
  sidebarCollapsed: boolean;
  notificationsPanelOpen: boolean;
  fullscreen: boolean;
  theme: 'light' | 'dark' | 'system';
}

export function MainLayout({ children }: MainLayoutProps) {
  const settings = useSettings();
  const animation = useAnimationState();
  const notifications = useNotifications();
  const shortcuts = useKeyboardShortcuts();

  const [layoutState, setLayoutState] = useState<LayoutState>({
    sidebarCollapsed: false,
    notificationsPanelOpen: false,
    fullscreen: false,
    theme: settings.state.settings?.theme || 'system'
  });

  // Sync theme with settings
  useEffect(() => {
    setLayoutState(prev => ({ ...prev, theme: settings.state.settings?.theme || 'system' }));
  }, [settings.state.settings?.theme]);

  // Sync notifications panel with context
  useEffect(() => {
    setLayoutState(prev => ({ 
      ...prev, 
      notificationsPanelOpen: notifications.state.isNotificationsPanelOpen 
    }));
  }, [notifications.state.isNotificationsPanelOpen]);

  // Layout control handlers
  const toggleSidebar = useCallback(() => {
    setLayoutState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  }, []);

  const toggleNotificationsPanel = useCallback(() => {
    notifications.toggleNotificationsPanel();
  }, [notifications]);

  const toggleFullscreen = useCallback(async () => {
    try {
      await window.electronAPI?.window.toggleFullscreen();
      const isFullscreen = await window.electronAPI?.window.isFullscreen();
      setLayoutState(prev => ({ ...prev, fullscreen: isFullscreen || false }));
    } catch (error) {
      notifications.showError('Failed to toggle fullscreen mode');
    }
  }, [notifications]);

  const handleThemeChange = useCallback((theme: 'light' | 'dark' | 'system') => {
    settings.applyTheme(theme); // Use applyTheme from context, not switchTheme
  }, [settings]);

  // Window control handlers
  const handleMinimize = useCallback(async () => {
    try {
      await window.electronAPI?.window.minimize();
    } catch (error) {
      notifications.showError('Failed to minimize window');
    }
  }, [notifications]);

  const handleMaximize = useCallback(async () => {
    try {
      await window.electronAPI?.window.maximize();
    } catch (error) {
      notifications.showError('Failed to maximize window');
    }
  }, [notifications]);

  const handleClose = useCallback(async () => {
    try {
      // Check for unsaved changes
      if (settings.state.hasUnsavedChanges) {
        const confirmed = confirm('You have unsaved settings. Are you sure you want to close?');
        if (!confirmed) return;
      }
      
      // Stop animation if running
      if (animation.state.isAnimationRunning) {
        await animation.stop();
      }
      
      // Stop engine if running
      if (animation.state.isEngineRunning) {
        await animation.stopEngine();
      }
      
      await window.electronAPI?.window.close();
    } catch (error) {
      notifications.showError('Failed to close application');
    }
  }, [settings.state.hasUnsavedChanges, animation, notifications]);

  // Get current status for header
  const getEngineStatus = () => {
    if (!animation.state.isEngineRunning) return 'stopped';
    if (!animation.engineStatus.isHealthy) return 'error';
    return 'running';
  };

  const getAnimationStatus = () => {
    if (!animation.state.isAnimationRunning) return 'stopped';
    if (animation.state.isPaused) return 'paused';
    return 'playing';
  };

  // Calculate layout classes
  const layoutClasses = [
    'main-layout',
    `theme-${layoutState.theme}`,
    layoutState.sidebarCollapsed && 'sidebar-collapsed',
    layoutState.notificationsPanelOpen && 'notifications-open',
    layoutState.fullscreen && 'fullscreen',
    animation.state.isAnimationRunning && 'animation-active'
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses}>
      {/* Title Bar (Custom window controls for cross-platform) */}
      <div className="title-bar">
        <div className="title-bar-drag-region">
          <div className="app-title">
            <span className="app-name">Point Shooting</span>
            {animation.loadedImage && (
              <span className="current-file">- {animation.loadedImage.filename}</span>
            )}
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="status-indicators">
          <div className={`status-indicator engine-status ${getEngineStatus()}`}>
            <span className="status-dot"></span>
            <span className="status-label">Engine</span>
          </div>
          
          <div className={`status-indicator animation-status ${getAnimationStatus()}`}>
            <span className="status-dot"></span>
            <span className="status-label">Animation</span>
          </div>
          
          {notifications.state.unreadCount > 0 && (
            <div className="notification-badge" onClick={toggleNotificationsPanel}>
              {notifications.state.unreadCount}
            </div>
          )}
        </div>

        {/* Window controls */}
        <div className="window-controls">
          <button 
            className="window-control minimize"
            onClick={handleMinimize}
            title="Minimize"
          >
            <span>−</span>
          </button>
          <button 
            className="window-control maximize"
            onClick={handleMaximize}
            title="Maximize"
          >
            <span>□</span>
          </button>
          <button 
            className="window-control close"
            onClick={handleClose}
            title="Close"
          >
            <span>×</span>
          </button>
        </div>
      </div>

      {/* Main Application Content */}
      <div className="app-content">
        {/* Header Bar */}
        <header className="header-bar">
          <div className="header-left">
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              title="Toggle Sidebar"
            >
              <span className="hamburger-icon">☰</span>
            </button>
            
            {/* Breadcrumb/Current context */}
            <div className="breadcrumb">
              {animation.state.currentStage && (
                <span className="current-stage">
                  {animation.state.currentStage.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          <div className="header-center">
            {/* Progress indicator when animation is running */}
            {animation.state.isAnimationRunning && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${animation.progress * 100}%` }}
                  />
                </div>
                <span className="progress-text">
                  {Math.round(animation.progress * 100)}%
                </span>
              </div>
            )}
          </div>

          <div className="header-right">
            {/* Theme switcher */}
            <div className="theme-switcher">
              <select 
                value={layoutState.theme}
                onChange={(e) => handleThemeChange(e.target.value as any)}
                title="Change Theme"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Fullscreen toggle */}
            <button 
              className="fullscreen-toggle"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen (F11)"
            >
              {layoutState.fullscreen ? '⛶' : '⛶'}
            </button>

            {/* Notifications toggle */}
            <button 
              className="notifications-toggle"
              onClick={toggleNotificationsPanel}
              title="Toggle Notifications (Ctrl+Tab)"
            >
              <span className="notification-icon">🔔</span>
              {notifications.state.unreadCount > 0 && (
                <span className="notification-count">{notifications.state.unreadCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Sidebar */}
          <aside className={`sidebar ${layoutState.sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <h2>Controls</h2>
            </div>
            
            <div className="sidebar-content">
              {/* Sidebar content will be rendered by child components */}
              <div className="sidebar-section">
                <h3>Quick Actions</h3>
                {/* Quick action buttons would go here */}
              </div>
              
              <div className="sidebar-section">
                <h3>Engine Status</h3>
                <div className="engine-info">
                  <div>Status: {getEngineStatus()}</div>
                  {animation.state.metrics && (
                    <>
                      <div>FPS: {animation.state.metrics.fps}</div>
                      <div>Particles: {animation.state.metrics.particleCount}</div>
                      <div>Memory: {Math.round(animation.state.metrics.memoryUsage)}MB</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            {children}
          </main>

          {/* Notifications Panel */}
          {layoutState.notificationsPanelOpen && (
            <aside className="notifications-panel">
              <div className="notifications-header">
                <h2>Notifications</h2>
                <button 
                  className="close-notifications"
                  onClick={toggleNotificationsPanel}
                >
                  ×
                </button>
              </div>
              
              <div className="notifications-content">
                <div className="notifications-actions">
                  <button onClick={notifications.markAllAsRead}>
                    Mark All Read
                  </button>
                  <button onClick={notifications.clearAllNotifications}>
                    Clear All
                  </button>
                </div>
                
                <div className="notifications-list">
                  {notifications.state.notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`notification-item ${notification.type} ${!notification.isRead ? 'unread' : ''}`}
                    >
                      <div className="notification-header">
                        <span className="notification-title">{notification.title}</span>
                        <span className="notification-time">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                        <button 
                          className="notification-close"
                          onClick={() => notifications.removeNotification(notification.id)}
                        >
                          ×
                        </button>
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      {notification.actions && (
                        <div className="notification-actions">
                          {notification.actions.map(action => (
                            <button
                              key={action.id}
                              className={`notification-action ${action.variant || 'secondary'}`}
                              onClick={action.handler}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {notifications.state.notifications.length === 0 && (
                    <div className="empty-notifications">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Footer */}
        <footer className="footer-bar">
          <div className="footer-left">
            {animation.state.loadedImage && (
              <div className="image-info">
                <span>{animation.state.loadedImage.filename}</span>
                <span className="image-details">
                  {animation.state.loadedImage.dimensions.width}×{animation.state.loadedImage.dimensions.height}
                  • {animation.state.loadedImage.format}
                  • {Math.round(animation.state.loadedImage.fileSize / 1024)}KB
                </span>
              </div>
            )}
          </div>

          <div className="footer-center">
            {animation.state.isAnimationRunning && animation.estimatedTimeRemaining && (
              <div className="time-remaining">
                {Math.round(animation.estimatedTimeRemaining / 1000)}s remaining
              </div>
            )}
          </div>

          <div className="footer-right">
            {settings.state.error && (
              <div className="error-indicator" title={settings.state.error}>
                ⚠ Settings Error
              </div>
            )}
            
            {animation.hasErrors && (
              <div className="error-indicator" title="Animation Errors">
                ⚠ Engine Error
              </div>
            )}
            
            <div className="keyboard-help">
              <button 
                onClick={shortcuts.showShortcutsHelp}
                title="Keyboard Shortcuts (Ctrl+?)"
              >
                ⌨ Help
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast notifications */}
      {notifications.state.toast && (
        <div className={`toast toast-${notifications.state.toast.type}`}>
          <div className="toast-content">
            {notifications.state.toast.message}
          </div>
          <button 
            className="toast-close"
            onClick={notifications.hideToast}
          >
            ×
          </button>
        </div>
      )}
      
      {/* Keyboard shortcuts help overlay */}
      <ShortcutsHelpOverlay
        isOpen={shortcuts.isHelpOverlayOpen}
        onClose={shortcuts.hideShortcutsHelp}
        shortcuts={shortcuts.getAllShortcuts()}
        getShortcutDisplay={shortcuts.getShortcutDisplay as any}
      />
    </div>
  );
}
