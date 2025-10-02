/**
 * Internationalization (i18n) Configuration
 * 
 * Comprehensive i18n system featuring:
 * - TypeScript-safe translation keys with autocomplete
 * - Dynamic locale loading and switching
 * - Pluralization support for different languages
 * - Date/time/number formatting per locale
 * - RTL language support preparation
 * - Locale persistence in settings
 * - Fallback to English for missing translations
 * - Context-aware translations for UI components
 * - Performance optimization with lazy loading
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, createElement } from 'react';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    currency: string;
  };
}

export interface TranslationKey {
  [key: string]: string | TranslationKey;
}

export interface Translations {
  [locale: string]: TranslationKey;
}

// Comprehensive translation keys structure for type safety
export interface TranslationKeys {
  // Application-level translations
  app: {
    name: string;
    description: string;
    loading: string;
    error: string;
    retry: string;
    close: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    update: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    finish: string;
  };
  
  // Navigation and menus
  navigation: {
    file: string;
    edit: string;
    view: string;
    tools: string;
    help: string;
    settings: string;
    about: string;
    quit: string;
    preferences: string;
  };
  
  // Animation controls
  animation: {
    play: string;
    pause: string;
    stop: string;
    reset: string;
    restart: string;
    speed: string;
    loop: string;
    progress: string;
    duration: string;
    frame: string;
    frames: string;
    fps: string;
    particles: string;
    stage: string;
    stages: {
      preStart: string;
      burst: string;
      chaos: string;
      converging: string;
      formation: string;
      finalBreathing: string;
    };
  };
  
  // File operations
  file: {
    open: string;
    openImage: string;
    save: string;
    saveAs: string;
    export: string;
    import: string;
    recent: string;
    clear: string;
    browse: string;
    upload: string;
    download: string;
    formats: {
      supported: string;
      image: string;
      preset: string;
      config: string;
    };
    errors: {
      notFound: string;
      invalidFormat: string;
      tooLarge: string;
      corrupted: string;
      noPermission: string;
    };
  };
  
  // Settings panels
  settings: {
    title: string;
    general: string;
    animation: string;
    performance: string;
    advanced: string;
    reset: string;
    resetAll: string;
    resetConfirm: string;
    apply: string;
    defaults: string;
    
    // Animation settings
    animationSettings: {
      density: string;
      speed: string;
      colorMode: string;
      colorModes: {
        stylized: string;
        precise: string;
      };
      watermark: string;
      hud: string;
      background: string;
      blur: string;
      breathing: string;
    };
    
    // Appearance settings
    appearance: {
      theme: string;
      themes: {
        light: string;
        dark: string;
        system: string;
      };
      contrast: string;
      contrastModes: {
        normal: string;
        high: string;
      };
      fontSize: string;
      fontSizes: {
        small: string;
        medium: string;
        large: string;
      };
      language: string;
      direction: string;
    };
    
    // Keyboard settings
    keyboard: {
      shortcuts: string;
      recordShortcut: string;
      recording: string;
      record: string;
      cancel: string;
      reset: string;
      clear: string;
      conflicts: string;
      categories: {
        playback: string;
        navigation: string;
        editing: string;
        file: string;
        view: string;
        system: string;
      };
      actions: {
        playPause: string;
        stop: string;
        restart: string;
        openImage: string;
        savePreset: string;
        exportAnimation: string;
        toggleSettings: string;
        toggleControls: string;
        focusSearch: string;
        zoomIn: string;
        zoomOut: string;
        zoomFit: string;
        increaseSpeed: string;
        decreaseSpeed: string;
        increaseParticles: string;
        decreaseParticles: string;
        toggleFullscreen: string;
        minimize: string;
        quit: string;
      };
    };
  };
  
  // Performance monitoring
  performance: {
    fps: string;
    frameTime: string;
    memory: string;
    particles: string;
    stage: string;
    optimization: string;
    warning: string;
    critical: string;
    suggestions: {
      reduceParticles: string;
      lowerResolution: string;
      disableEffects: string;
      closeOtherApps: string;
    };
  };
  
  // Error messages and notifications
  errors: {
    general: string;
    network: string;
    fileSystem: string;
    performance: string;
    validation: string;
    timeout: string;
    unknown: string;
    details: string;
    report: string;
    
    // Specific error types
    imageLoad: string;
    presetLoad: string;
    settingsSave: string;
    exportFailed: string;
    importFailed: string;
    engineConnection: string;
    memoryLimit: string;
    performanceIssue: string;
  };
  
  // Success messages
  success: {
    imageLoded: string;
    presetSaved: string;
    presetLoaded: string;
    settingsSaved: string;
    exported: string;
    imported: string;
    reset: string;
    updated: string;
  };
  
  // Tooltips and help
  help: {
    dragDrop: string;
    shortcuts: string;
    performance: string;
    themes: string;
    presets: string;
    export: string;
    troubleshooting: string;
    
    // Feature-specific help
    controls: {
      play: string;
      speed: string;
      particles: string;
      zoom: string;
      reset: string;
    };
    
    settings: {
      density: string;
      colorMode: string;
      watermark: string;
      theme: string;
      shortcuts: string;
    };
  };
  
  // Accessibility labels
  accessibility: {
    labels: {
      closeDialog: string;
      openMenu: string;
      playAnimation: string;
      pauseAnimation: string;
      volumeSlider: string;
      speedSlider: string;
      particleSlider: string;
      themeSelector: string;
      languageSelector: string;
    };
    
    descriptions: {
      animationView: string;
      controlPanel: string;
      settingsPanel: string;
      imagePreview: string;
      progressIndicator: string;
    };
    
    instructions: {
      dragDrop: string;
      keyboard: string;
      navigation: string;
    };
  };
  
  // Time and date formatting
  time: {
    formats: {
      short: string;
      long: string;
      relative: string;
    };
    units: {
      seconds: string;
      minutes: string;
      hours: string;
      days: string;
    };
    relative: {
      now: string;
      secondsAgo: string;
      minutesAgo: string;
      hoursAgo: string;
      daysAgo: string;
      future: string;
    };
  };
  
  // Number formatting
  numbers: {
    currency: string;
    percent: string;
    decimal: string;
    integer: string;
    fileSize: {
      bytes: string;
      kilobytes: string;
      megabytes: string;
      gigabytes: string;
    };
  };
}

// ==========================================
// SUPPORTED LOCALES CONFIGURATION
// ==========================================

export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm:ss',
    numberFormat: {
      decimal: '.',
      thousands: ',',
      currency: '$',
    },
  },
  uk: {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm:ss',
    numberFormat: {
      decimal: ',',
      thousands: ' ',
      currency: '₴',
    },
  },
};

export const DEFAULT_LOCALE = 'en';
export const FALLBACK_LOCALE = 'en';

// ==========================================
// TRANSLATION LOADING UTILITIES
// ==========================================

class TranslationLoader {
  private cache: Map<string, TranslationKey> = new Map();
  private loadingPromises: Map<string, Promise<TranslationKey>> = new Map();

  async loadTranslations(locale: string): Promise<TranslationKey> {
    // Return cached translations if available
    if (this.cache.has(locale)) {
      return this.cache.get(locale)!;
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(locale)) {
      return this.loadingPromises.get(locale)!;
    }

    // Start loading translations
    const loadingPromise = this.fetchTranslations(locale);
    this.loadingPromises.set(locale, loadingPromise);

    try {
      const translations = await loadingPromise;
      this.cache.set(locale, translations);
      this.loadingPromises.delete(locale);
      return translations;
    } catch (error) {
      this.loadingPromises.delete(locale);
      
      // Fallback to default locale if loading fails
      if (locale !== FALLBACK_LOCALE) {
        console.warn(`Failed to load translations for ${locale}, falling back to ${FALLBACK_LOCALE}`, error);
        return this.loadTranslations(FALLBACK_LOCALE);
      }
      
      throw error;
    }
  }

  private async fetchTranslations(locale: string): Promise<TranslationKey> {
    try {
      // Dynamic import for translation files
      const module = await import(`./locales/${locale}.json`);
      return module.default;
    } catch (error) {
      throw new Error(`Failed to load translations for locale: ${locale}`);
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  preloadTranslations(locales: string[]): Promise<void[]> {
    const promises = locales.map(locale => 
      this.loadTranslations(locale).catch(error => 
        console.warn(`Failed to preload ${locale}:`, error)
      )
    );
    return Promise.allSettled(promises) as unknown as Promise<void[]>;
  }
}

const translationLoader = new TranslationLoader();

// ==========================================
// I18N CONTEXT AND PROVIDER
// ==========================================

interface I18nContextType {
  locale: string;
  localeConfig: LocaleConfig;
  translations: TranslationKey;
  isLoading: boolean;
  error: string | null;
  
  // Methods
  setLocale: (locale: string) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date, format?: 'short' | 'long') => string;
  formatTime: (date: Date) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number) => string;
  formatFileSize: (bytes: number) => string;
  formatRelativeTime: (date: Date) => string;
  pluralize: (key: string, count: number, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: string;
  storageKey?: string;
  locale?: string; // Controlled locale from external source
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLocale = DEFAULT_LOCALE,
  storageKey = 'app-locale',
  locale: controlledLocale,
}) => {
  const [internalLocale, setInternalLocaleState] = useState<string>(defaultLocale);
  const [translations, setTranslations] = useState<TranslationKey>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use controlled locale if provided, otherwise use internal state
  const locale = controlledLocale !== undefined ? controlledLocale : internalLocale;

  // Get locale configuration
  const localeConfig = (SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES[DEFAULT_LOCALE])!;

  // Load saved locale from storage (only when not controlled)
  useEffect(() => {
    if (controlledLocale !== undefined) return; // Skip if controlled externally
    
    const savedLocale = localStorage.getItem(storageKey);
    if (savedLocale && SUPPORTED_LOCALES[savedLocale]) {
      setInternalLocaleState(savedLocale);
    } else {
      // Detect system locale
      const systemLocale = navigator.language.split('-')[0] || DEFAULT_LOCALE;
      if (SUPPORTED_LOCALES[systemLocale]) {
        setInternalLocaleState(systemLocale);
      }
    }
  }, [storageKey, controlledLocale]);

  // Load translations when locale changes
  useEffect(() => {
    let isCancelled = false;

    const loadTranslations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const newTranslations = await translationLoader.loadTranslations(locale);
        
        if (!isCancelled) {
          setTranslations(newTranslations);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    loadTranslations();

    return () => {
      isCancelled = true;
    };
  }, [locale]);

  // Change locale
  const setLocale = async (newLocale: string): Promise<void> => {
    if (!SUPPORTED_LOCALES[newLocale]) {
      throw new Error(`Unsupported locale: ${newLocale}`);
    }

    if (controlledLocale === undefined) {
      // Only update internal state if not controlled externally
      setInternalLocaleState(newLocale);
      localStorage.setItem(storageKey, newLocale);
    }

    // Update document attributes for styling and accessibility
    document.documentElement.lang = newLocale;
    document.documentElement.dir = SUPPORTED_LOCALES[newLocale].direction;
  };

  // Translation function with interpolation support
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;

    // Navigate through nested translation keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to key if translation not found
        console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key ${key} does not resolve to a string`);
      return key;
    }

    // Parameter interpolation
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  // Pluralization support
  const pluralize = (key: string, count: number, params?: Record<string, string | number>): string => {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`;
    const fallbackKey = count === 1 ? key : `${key}s`;
    
    const translation = t(pluralKey) !== pluralKey ? t(pluralKey) : t(fallbackKey);
    return t(translation, { count, ...params });
  };

  // Date formatting
  const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
    const options: Intl.DateTimeFormatOptions = format === 'long' 
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  // Time formatting
  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  // Number formatting
  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(locale, options).format(value);
  };

  // Currency formatting
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: localeConfig.numberFormat.currency === '$' ? 'USD' : 'UAH',
    }).format(value);
  };

  // File size formatting
  const formatFileSize = (bytes: number): string => {
    const units = ['bytes', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    const formattedSize = unitIndex === 0 ? size.toString() : size.toFixed(1);
    const unit = units[unitIndex] || 'bytes';
    return `${formattedSize} ${t(`numbers.fileSize.${unit.toLowerCase()}`)}`;
  };

  // Relative time formatting
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return t('time.relative.now');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('time.relative.minutesAgo', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('time.relative.hoursAgo', { count: hours });
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return t('time.relative.daysAgo', { count: days });
    }
  };

  const contextValue: I18nContextType = {
    locale,
    localeConfig,
    translations,
    isLoading,
    error,
    setLocale,
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatFileSize,
    formatRelativeTime,
    pluralize,
  };

  return createElement(
    I18nContext.Provider,
    { value: contextValue },
    children
  );
};

// ==========================================
// CUSTOM HOOKS
// ==========================================

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { t, pluralize } = useI18n();
  return { t, pluralize };
};

export const useLocale = () => {
  const { locale, localeConfig, setLocale } = useI18n();
  return { locale, localeConfig, setLocale };
};

export const useFormatting = () => {
  const { 
    formatDate, 
    formatTime, 
    formatNumber, 
    formatCurrency, 
    formatFileSize, 
    formatRelativeTime 
  } = useI18n();
  
  return {
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    formatFileSize,
    formatRelativeTime,
  };
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const getSupportedLocales = (): LocaleConfig[] => {
  return Object.values(SUPPORTED_LOCALES);
};

export const isRTL = (locale: string): boolean => {
  return SUPPORTED_LOCALES[locale]?.direction === 'rtl';
};

export const detectSystemLocale = (): string => {
  const systemLocale = navigator.language.split('-')[0] || DEFAULT_LOCALE;
  return SUPPORTED_LOCALES[systemLocale] ? systemLocale : DEFAULT_LOCALE;
};

export const preloadAllLocales = async (): Promise<void> => {
  const locales = Object.keys(SUPPORTED_LOCALES);
  await translationLoader.preloadTranslations(locales);
};

// ==========================================
// HIGHER-ORDER COMPONENTS
// ==========================================

export interface WithI18nProps {
  i18n: I18nContextType;
}

export const withI18n = <P extends WithI18nProps>(
  Component: React.ComponentType<P>
) => {
  const WrappedComponent: React.FC<Omit<P, 'i18n'>> = (props) => {
    const i18n = useI18n();
    return createElement(Component, { ...(props as P), i18n } as P);
  };

  WrappedComponent.displayName = `withI18n(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default I18nProvider;
