/**
 * VersionInfo Component
 * 
 * Comprehensive version and system information display with:
 * - Application version, build number, and build date
 * - System information (OS, architecture, Node.js version)
 * - Environment details (development/production mode)
 * - Dependency versions for key packages
 * - Hardware information (CPU, memory)
 * - Performance metrics and diagnostics
 * - Update checking and notification system
 * - Export functionality for support tickets
 * - Expandable sections for detailed info
 * - Copy-to-clipboard functionality
 * 
 * Used in about dialogs, settings panels,
 * and support/debug information screens.
 */

import React, { useState, useEffect, useCallback } from 'react';
import './VersionInfo.css';

export interface VersionData {
  // Application info
  appVersion: string;
  buildNumber?: string;
  buildDate?: string;
  gitCommit?: string;
  gitBranch?: string;
  
  // Environment
  environment: 'development' | 'production' | 'staging' | 'testing';
  nodeVersion?: string;
  electronVersion?: string;
  chromeVersion?: string;
  
  // System info
  platform?: string;
  architecture?: string;
  cpuCount?: number;
  totalMemory?: number;
  freeMemory?: number;
  
  // Dependencies
  dependencies?: Record<string, string>;
}

export interface SystemMetrics {
  uptime: number;
  cpuUsage?: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  diskUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseNotes?: string;
  downloadUrl?: string;
}

export interface VersionInfoProps {
  versionData: VersionData;
  systemMetrics?: SystemMetrics;
  updateInfo?: UpdateInfo;
  
  // Display options
  showSystemInfo?: boolean;
  showMetrics?: boolean;
  showDependencies?: boolean;
  showUpdateCheck?: boolean;
  compact?: boolean;
  expandable?: boolean;
  
  // Callbacks
  onUpdateCheck?: () => Promise<UpdateInfo>;
  onExportInfo?: () => void;
  onCopyToClipboard?: (content: string) => Promise<void>;
  
  // Styling
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  icon
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="version-section">
      <button
        type="button"
        className="section-header"
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
      >
        <span className="section-title">
          {icon && <span className="section-icon" aria-hidden="true">{icon}</span>}
          {title}
        </span>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode; copyable?: boolean; onCopy?: () => void }> = ({
  label,
  value,
  copyable = false,
  onCopy
}) => (
  <div className="info-row">
    <span className="info-label">{label}:</span>
    <span className="info-value">
      {value}
      {copyable && (
        <button
          type="button"
          className="copy-button"
          onClick={onCopy}
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
        >
          📋
        </button>
      )}
    </span>
  </div>
);

const ProgressBar: React.FC<{ value: number; max: number; label?: string; color?: string }> = ({
  value,
  max,
  label,
  color = '#3b82f6'
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const getColor = () => {
    if (percentage > 80) return '#ef4444';
    if (percentage > 60) return '#f59e0b';
    return color;
  };

  return (
    <div className="progress-container">
      {label && <span className="progress-label">{label}</span>}
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getColor()
          }}
        />
      </div>
      <span className="progress-text">
        {formatBytes(value)} / {formatBytes(max)} ({percentage.toFixed(1)}%)
      </span>
    </div>
  );
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const VersionInfo: React.FC<VersionInfoProps> = ({
  versionData,
  systemMetrics,
  updateInfo,
  showSystemInfo = true,
  showMetrics = false,
  showDependencies = false,
  showUpdateCheck = false,
  compact = false,
  expandable = true,
  onUpdateCheck,
  onExportInfo,
  onCopyToClipboard,
  className = '',
  theme = 'auto'
}) => {
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [currentUpdateInfo, setCurrentUpdateInfo] = useState(updateInfo);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Auto-detect theme if set to auto
  const [detectedTheme, setDetectedTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setDetectedTheme(mediaQuery.matches ? 'dark' : 'light');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setDetectedTheme(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    return undefined; // Return undefined when theme is not 'auto'
  }, [theme]);

  const actualTheme = theme === 'auto' ? detectedTheme : theme;

  const handleUpdateCheck = useCallback(async () => {
    if (!onUpdateCheck || isCheckingUpdates) return;

    setIsCheckingUpdates(true);
    try {
      const result = await onUpdateCheck();
      setCurrentUpdateInfo(result);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsCheckingUpdates(false);
    }
  }, [onUpdateCheck, isCheckingUpdates]);

  const handleCopy = useCallback(async (content: string, item: string) => {
    if (onCopyToClipboard) {
      await onCopyToClipboard(content);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(content);
    }
    
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  }, [onCopyToClipboard]);

  const generateFullInfo = useCallback((): string => {
    const info = [];
    
    // Application info
    info.push('=== Application Information ===');
    info.push(`Version: ${versionData.appVersion}`);
    if (versionData.buildNumber) info.push(`Build: ${versionData.buildNumber}`);
    if (versionData.buildDate) info.push(`Build Date: ${versionData.buildDate}`);
    if (versionData.gitCommit) info.push(`Git Commit: ${versionData.gitCommit}`);
    if (versionData.gitBranch) info.push(`Git Branch: ${versionData.gitBranch}`);
    info.push(`Environment: ${versionData.environment}`);
    info.push('');
    
    // System info
    if (showSystemInfo) {
      info.push('=== System Information ===');
      if (versionData.platform) info.push(`Platform: ${versionData.platform}`);
      if (versionData.architecture) info.push(`Architecture: ${versionData.architecture}`);
      if (versionData.nodeVersion) info.push(`Node.js: ${versionData.nodeVersion}`);
      if (versionData.electronVersion) info.push(`Electron: ${versionData.electronVersion}`);
      if (versionData.chromeVersion) info.push(`Chrome: ${versionData.chromeVersion}`);
      if (versionData.cpuCount) info.push(`CPU Cores: ${versionData.cpuCount}`);
      if (versionData.totalMemory) info.push(`Total Memory: ${formatBytes(versionData.totalMemory)}`);
      info.push('');
    }
    
    // Metrics
    if (showMetrics && systemMetrics) {
      info.push('=== System Metrics ===');
      info.push(`Uptime: ${formatUptime(systemMetrics.uptime)}`);
      if (systemMetrics.cpuUsage !== undefined) info.push(`CPU Usage: ${systemMetrics.cpuUsage.toFixed(1)}%`);
      info.push(`Memory Usage: ${formatBytes(systemMetrics.memoryUsage.used)} / ${formatBytes(systemMetrics.memoryUsage.total)} (${systemMetrics.memoryUsage.percentage.toFixed(1)}%)`);
      if (systemMetrics.diskUsage) {
        info.push(`Disk Usage: ${formatBytes(systemMetrics.diskUsage.used)} / ${formatBytes(systemMetrics.diskUsage.total)} (${systemMetrics.diskUsage.percentage.toFixed(1)}%)`);
      }
      info.push('');
    }
    
    // Dependencies
    if (showDependencies && versionData.dependencies) {
      info.push('=== Dependencies ===');
      Object.entries(versionData.dependencies).forEach(([name, version]) => {
        info.push(`${name}: ${version}`);
      });
      info.push('');
    }
    
    info.push(`Generated: ${new Date().toISOString()}`);
    
    return info.join('\n');
  }, [versionData, systemMetrics, showSystemInfo, showMetrics, showDependencies]);

  const handleExport = useCallback(() => {
    if (onExportInfo) {
      onExportInfo();
    } else {
      const content = generateFullInfo();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `version-info-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }, [onExportInfo, generateFullInfo]);

  const versionClasses = [
    'version-info',
    `theme-${actualTheme}`,
    compact && 'compact',
    expandable && 'expandable',
    className
  ].filter(Boolean).join(' ');

  if (compact) {
    return (
      <div className={versionClasses}>
        <div className="version-compact">
          <span className="app-version">v{versionData.appVersion}</span>
          {versionData.buildNumber && (
            <span className="build-number">#{versionData.buildNumber}</span>
          )}
          <span className="environment-badge">{versionData.environment}</span>
          {currentUpdateInfo?.available && (
            <span className="update-badge">Update Available</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={versionClasses}>
      <div className="version-header">
        <h3 className="version-title">Version Information</h3>
        <div className="header-actions">
          {showUpdateCheck && (
            <button
              type="button"
              className="action-button update-button"
              onClick={handleUpdateCheck}
              disabled={isCheckingUpdates}
            >
              {isCheckingUpdates ? '⏳' : '🔄'} Check Updates
            </button>
          )}
          <button
            type="button"
            className="action-button copy-button"
            onClick={() => handleCopy(generateFullInfo(), 'full-info')}
            title="Copy all information"
          >
            {copiedItem === 'full-info' ? '✅' : '📋'} Copy All
          </button>
          <button
            type="button"
            className="action-button export-button"
            onClick={handleExport}
            title="Export to file"
          >
            💾 Export
          </button>
        </div>
      </div>

      {/* Update notification */}
      {currentUpdateInfo?.available && (
        <div className="update-notification">
          <div className="update-icon">🚀</div>
          <div className="update-content">
            <strong>Update Available!</strong>
            <p>Version {currentUpdateInfo.latestVersion} is now available</p>
            {currentUpdateInfo.releaseNotes && (
              <p className="release-notes">{currentUpdateInfo.releaseNotes}</p>
            )}
          </div>
          {currentUpdateInfo.downloadUrl && (
            <a 
              href={currentUpdateInfo.downloadUrl}
              className="update-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
          )}
        </div>
      )}

      <div className="version-content">
        {/* Application Info */}
        <CollapsibleSection title="Application" defaultExpanded={true} icon="📱">
          <InfoRow 
            label="Version" 
            value={versionData.appVersion}
            copyable
            onCopy={() => handleCopy(versionData.appVersion, 'version')}
          />
          {versionData.buildNumber && (
            <InfoRow 
              label="Build" 
              value={versionData.buildNumber}
              copyable
              onCopy={() => handleCopy(versionData.buildNumber!, 'build')}
            />
          )}
          {versionData.buildDate && (
            <InfoRow label="Build Date" value={versionData.buildDate} />
          )}
          {versionData.gitCommit && (
            <InfoRow 
              label="Git Commit" 
              value={
                <code className="commit-hash">
                  {versionData.gitCommit.slice(0, 8)}
                </code>
              }
              copyable
              onCopy={() => handleCopy(versionData.gitCommit!, 'commit')}
            />
          )}
          {versionData.gitBranch && (
            <InfoRow label="Git Branch" value={versionData.gitBranch} />
          )}
          <InfoRow 
            label="Environment" 
            value={
              <span className={`environment-badge ${versionData.environment}`}>
                {versionData.environment}
              </span>
            }
          />
        </CollapsibleSection>

        {/* System Info */}
        {showSystemInfo && (
          <CollapsibleSection title="System" defaultExpanded={!expandable} icon="💻">
            {versionData.platform && (
              <InfoRow label="Platform" value={versionData.platform} />
            )}
            {versionData.architecture && (
              <InfoRow label="Architecture" value={versionData.architecture} />
            )}
            {versionData.nodeVersion && (
              <InfoRow label="Node.js" value={versionData.nodeVersion} />
            )}
            {versionData.electronVersion && (
              <InfoRow label="Electron" value={versionData.electronVersion} />
            )}
            {versionData.chromeVersion && (
              <InfoRow label="Chrome" value={versionData.chromeVersion} />
            )}
            {versionData.cpuCount && (
              <InfoRow label="CPU Cores" value={versionData.cpuCount} />
            )}
            {versionData.totalMemory && (
              <InfoRow 
                label="Total Memory" 
                value={formatBytes(versionData.totalMemory)} 
              />
            )}
          </CollapsibleSection>
        )}

        {/* System Metrics */}
        {showMetrics && systemMetrics && (
          <CollapsibleSection title="Performance" defaultExpanded={false} icon="📊">
            <InfoRow label="Uptime" value={formatUptime(systemMetrics.uptime)} />
            {systemMetrics.cpuUsage !== undefined && (
              <InfoRow label="CPU Usage" value={`${systemMetrics.cpuUsage.toFixed(1)}%`} />
            )}
            <div className="metric-item">
              <ProgressBar
                value={systemMetrics.memoryUsage.used}
                max={systemMetrics.memoryUsage.total}
                label="Memory Usage"
              />
            </div>
            {systemMetrics.diskUsage && (
              <div className="metric-item">
                <ProgressBar
                  value={systemMetrics.diskUsage.used}
                  max={systemMetrics.diskUsage.total}
                  label="Disk Usage"
                />
              </div>
            )}
          </CollapsibleSection>
        )}

        {/* Dependencies */}
        {showDependencies && versionData.dependencies && (
          <CollapsibleSection title="Dependencies" defaultExpanded={false} icon="📦">
            <div className="dependencies-list">
              {Object.entries(versionData.dependencies).map(([name, version]) => (
                <InfoRow 
                  key={name}
                  label={name} 
                  value={version}
                  copyable
                  onCopy={() => handleCopy(`${name}@${version}`, `dep-${name}`)}
                />
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
};

// Hook for gathering system information
export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<VersionData | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    // Gather basic system information
    const info: VersionData = {
      appVersion: '1.0.0', // Should be replaced with actual app version
      environment: process.env.NODE_ENV as any || 'development',
      platform: navigator.platform,
      architecture: navigator.platform.includes('64') ? 'x64' : 'x86'
    };

    // Add more details if available (electron-specific)
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      // These would be provided by electron preload script
      const electronAPI = (window as any).electronAPI;
      
      electronAPI.getSystemInfo?.().then((electronInfo: any) => {
        setSystemInfo({
          ...info,
          ...electronInfo
        });
      });

      electronAPI.getSystemMetrics?.().then((metrics: SystemMetrics) => {
        setSystemMetrics(metrics);
      });
    } else {
      setSystemInfo(info);
      
      // Web-based metrics
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setSystemMetrics({
          uptime: performance.now() / 1000,
          memoryUsage: {
            used: memInfo.usedJSHeapSize || 0,
            total: memInfo.totalJSHeapSize || 0,
            percentage: memInfo.usedJSHeapSize / memInfo.totalJSHeapSize * 100 || 0
          }
        });
      }
    }
  }, []);

  return { systemInfo, systemMetrics };
};
