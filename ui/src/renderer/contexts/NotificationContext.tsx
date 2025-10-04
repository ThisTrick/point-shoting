/**
 * NotificationContext Provider
 * React context for managing user notifications and messages
 */

import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import '../../types/electron';

// Notification types
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  duration?: number; // Auto-dismiss after ms, undefined = manual dismiss
  actions?: NotificationAction[];
  metadata?: any;
  isRead: boolean;
  isPersistent: boolean; // Should survive app restarts
}

type NotificationType = 
  | 'success' 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'engine-status' 
  | 'file-operation' 
  | 'animation-event' 
  | 'system';

interface NotificationAction {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  handler: () => void | Promise<void>;
}

interface NotificationState {
  notifications: Notification[];
  toast: ToastNotification | null;
  unreadCount: number;
  isNotificationsPanelOpen: boolean;
  settings: NotificationSettings;
}

interface ToastNotification {
  id: string;
  type: NotificationType;
  message: string;
  duration: number;
  actions?: NotificationAction[];
}

interface NotificationSettings {
  enableToasts: boolean;
  enableSounds: boolean;
  enableSystemNotifications: boolean;
  autoHideSuccess: boolean;
  defaultDuration: number;
  maxNotifications: number;
}

// Notification actions
type NotificationActionType =
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'REMOVE_NOTIFICATION'; id: string }
  | { type: 'MARK_AS_READ'; id: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'CLEAR_NOTIFICATIONS_BY_TYPE'; notificationType: NotificationType }
  | { type: 'SHOW_TOAST'; toast: ToastNotification }
  | { type: 'HIDE_TOAST' }
  | { type: 'TOGGLE_NOTIFICATIONS_PANEL' }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<NotificationSettings> };

// Notification context interface
interface NotificationContextValue {
  // State
  state: NotificationState;
  
  // Notification management
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => string;
  showToast: (toast: Omit<ToastNotification, 'id'>) => void;
  showSuccess: (message: string, title?: string, actions?: NotificationAction[]) => string;
  showError: (message: string, title?: string, actions?: NotificationAction[]) => string;
  showWarning: (message: string, title?: string, actions?: NotificationAction[]) => string;
  showInfo: (message: string, title?: string, actions?: NotificationAction[]) => string;
  
  // Engine-specific notifications
  showEngineStatus: (message: string, type: 'success' | 'error' | 'warning') => string;
  showFileOperation: (message: string, type: 'success' | 'error') => string;
  showAnimationEvent: (message: string, metadata?: any) => string;
  
  // Management
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  clearNotificationsByType: (type: NotificationType) => void;
  
  // UI control
  hideToast: () => void;
  toggleNotificationsPanel: () => void;
  
  // Settings
  updateSettings: (settings: Partial<NotificationSettings>) => void;
}

// Default settings
const defaultSettings: NotificationSettings = {
  enableToasts: true,
  enableSounds: false,
  enableSystemNotifications: true,
  autoHideSuccess: true,
  defaultDuration: 5000,
  maxNotifications: 50
};

// Initial state
const initialState: NotificationState = {
  notifications: [],
  toast: null,
  unreadCount: 0,
  isNotificationsPanelOpen: false,
  settings: defaultSettings
};

// Utility function to generate unique IDs
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Notification reducer
function notificationReducer(state: NotificationState, action: NotificationActionType): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotifications = [action.notification, ...state.notifications]
        .slice(0, state.settings.maxNotifications);
      
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: state.unreadCount + 1
      };
    }
    
    case 'REMOVE_NOTIFICATION': {
      const notification = state.notifications.find(n => n.id === action.id);
      const wasUnread = notification && !notification.isRead;
      
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      };
    }
    
    case 'MARK_AS_READ': {
      const notification = state.notifications.find(n => n.id === action.id);
      if (!notification || notification.isRead) {
        return state;
      }
      
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      };
    }
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      };
    
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0
      };
    
    case 'CLEAR_NOTIFICATIONS_BY_TYPE':
      const filteredNotifications = state.notifications.filter(n => n.type !== action.notificationType);
      const removedUnreadCount = state.notifications
        .filter(n => n.type === action.notificationType && !n.isRead)
        .length;
      
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: Math.max(0, state.unreadCount - removedUnreadCount)
      };
    
    case 'SHOW_TOAST':
      return {
        ...state,
        toast: action.toast
      };
    
    case 'HIDE_TOAST':
      return {
        ...state,
        toast: null
      };
    
    case 'TOGGLE_NOTIFICATIONS_PANEL':
      return {
        ...state,
        isNotificationsPanelOpen: !state.isNotificationsPanelOpen
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.settings }
      };
    
    default:
      return state;
  }
}

// Create context
const NotificationContext = createContext<NotificationContextValue | null>(null);

// Provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Core notification functions
  const showNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const id = generateId();
    const notification: Notification = {
      ...notificationData,
      id,
      timestamp: Date.now(),
      isRead: false
    };

    dispatch({ type: 'ADD_NOTIFICATION', notification });

    // Auto-dismiss if duration is set
    if (notification.duration) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', id });
      }, notification.duration);
    }

    // Show system notification if enabled
    if (state.settings.enableSystemNotifications && window.electronAPI?.notifications) {
      window.electronAPI.notifications.showSystemNotification({
        title: notification.title,
        body: notification.message,
        type: notification.type
      });
    }

    return id;
  }, [state.settings.enableSystemNotifications]);

  const showToast = useCallback((toastData: Omit<ToastNotification, 'id'>) => {
    if (!state.settings.enableToasts) return;

    const toast: ToastNotification = {
      ...toastData,
      id: generateId()
    };

    dispatch({ type: 'SHOW_TOAST', toast });

    // Auto-hide toast
    setTimeout(() => {
      dispatch({ type: 'HIDE_TOAST' });
    }, toast.duration);
  }, [state.settings.enableToasts]);

  // Convenience notification functions
  const showSuccess = useCallback((message: string, title?: string, actions?: NotificationAction[]) => {
    const duration = state.settings.autoHideSuccess ? state.settings.defaultDuration : undefined;
    
    return showNotification({
      type: 'success',
      title: title || 'Success',
      message,
      duration,
      actions,
      isPersistent: false
    });
  }, [showNotification, state.settings.autoHideSuccess, state.settings.defaultDuration]);

  const showError = useCallback((message: string, title?: string, actions?: NotificationAction[]) => {
    return showNotification({
      type: 'error',
      title: title || 'Error',
      message,
      actions,
      isPersistent: true
    });
  }, [showNotification]);

  const showWarning = useCallback((message: string, title?: string, actions?: NotificationAction[]) => {
    return showNotification({
      type: 'warning',
      title: title || 'Warning',
      message,
      actions,
      isPersistent: true
    });
  }, [showNotification]);

  const showInfo = useCallback((message: string, title?: string, actions?: NotificationAction[]) => {
    return showNotification({
      type: 'info',
      title: title || 'Information',
      message,
      duration: state.settings.defaultDuration,
      actions,
      isPersistent: false
    });
  }, [showNotification, state.settings.defaultDuration]);

  // Engine-specific notification functions
  const showEngineStatus = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    const title = type === 'success' ? 'Engine Ready' : type === 'error' ? 'Engine Error' : 'Engine Warning';
    
    return showNotification({
      type: 'engine-status',
      title,
      message,
      duration: type === 'success' ? state.settings.defaultDuration : undefined,
      isPersistent: type !== 'success'
    });
  }, [showNotification, state.settings.defaultDuration]);

  const showFileOperation = useCallback((message: string, type: 'success' | 'error') => {
    return showNotification({
      type: 'file-operation',
      title: type === 'success' ? 'File Operation Complete' : 'File Operation Failed',
      message,
      duration: type === 'success' ? state.settings.defaultDuration : undefined,
      isPersistent: type === 'error'
    });
  }, [showNotification, state.settings.defaultDuration]);

  const showAnimationEvent = useCallback((message: string, metadata?: any) => {
    return showNotification({
      type: 'animation-event',
      title: 'Animation Update',
      message,
      duration: state.settings.defaultDuration,
      metadata,
      isPersistent: false
    });
  }, [showNotification, state.settings.defaultDuration]);

  // Management functions
  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', id });
  }, []);

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, []);

  const clearNotificationsByType = useCallback((type: NotificationType) => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS_BY_TYPE', notificationType: type });
  }, []);

  // UI control functions
  const hideToast = useCallback(() => {
    dispatch({ type: 'HIDE_TOAST' });
  }, []);

  const toggleNotificationsPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_NOTIFICATIONS_PANEL' });
  }, []);

  // Settings function
  const updateSettings = useCallback((settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', settings });
    
    // Persist settings to electron store
    window.electronAPI?.settings.updateNotificationSettings(settings);
  }, []);

  const contextValue: NotificationContextValue = {
    state,
    showNotification,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showEngineStatus,
    showFileOperation,
    showAnimationEvent,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    clearNotificationsByType,
    hideToast,
    toggleNotificationsPanel,
    updateSettings
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Export types for use in components
export type {
  Notification,
  NotificationType,
  NotificationAction,
  NotificationState,
  ToastNotification,
  NotificationSettings
};
