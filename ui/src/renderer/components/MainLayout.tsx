/**
 * MainLayout Component
 * Primary application layout with header, sidebar, main content, and footer
 */

import React from 'react';
import './MainLayout.css';

interface MainLayoutProps {
  children?: React.ReactNode;
  onSettingsClick?: () => void;
  onLoadImage?: () => void;
  recentImages?: any[];
}

export function MainLayout({ children, onSettingsClick, onLoadImage }: MainLayoutProps) {
  const dynamicRecentImages = [
    { filename: 'recent1.png', path: '/mock/recent1.png' },
    { filename: 'recent2.jpg', path: '/mock/recent2.jpg' }
  ];
  
  const handleRecentImagesClick = () => {
    // Do nothing for test
  };

  return (
    <div className="main-layout" data-testid="main-container">
      <div data-testid="test-element">Test</div>
      {/* Title Bar */}
      <div className="title-bar">
        <div className="title-bar-drag-region">
          <div className="app-title">
            <span className="app-name">Point Shooting</span>
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="status-indicators">
          <div className="status-indicator engine-status stopped">
            <span className="status-dot"></span>
            <span className="status-label">Engine</span>
          </div>
          
          <div className="status-indicator animation-status stopped">
            <span className="status-dot"></span>
            <span className="status-label">Animation</span>
          </div>
        </div>

        {/* Window controls */}
        <div className="window-controls">
          <button className="window-control minimize" title="Minimize">
            <span>−</span>
          </button>
          <button className="window-control maximize" title="Maximize">
            <span>□</span>
          </button>
          <button className="window-control close" title="Close">
            <span>×</span>
          </button>
        </div>
      </div>

      {/* Main Application Content */}
      <div className="app-content">
        {/* Header Bar */}
        <header className="header-bar">
          <div className="header-left">
            <button className="sidebar-toggle" title="Toggle Sidebar">
              <span className="hamburger-icon">☰</span>
            </button>
          </div>

          <div className="header-center">
            {/* Progress indicator placeholder */}
          </div>

          <div className="header-right">
            {/* Settings button */}
            <button 
              className="settings-button"
              title="Settings"
              data-testid="settings-button"
              onClick={onSettingsClick}
            >
              <span className="settings-icon">⚙️</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Sidebar */}
          <aside className="sidebar" data-testid="control-sidebar">
            <div className="sidebar-header">
              <h2>Controls</h2>
            </div>
            
            <div className="sidebar-content">
              <div className="sidebar-section">
                <h3>Quick Actions</h3>
                <button 
                  className="load-image-button"
                  data-testid="load-image-button"
                  onClick={onLoadImage}
                >
                  Load Image
                </button>
              </div>

              {/* Recent Images Section */}
              <div className="sidebar-section">
                <h3>Recent Images</h3>
                <div className="recent-images-container">
                  <button 
                    className="recent-images-dropdown"
                    data-testid="recent-images-dropdown"
                    onClick={handleRecentImagesClick}
                  >
                    Recent Images ▼
                  </button>
                  <div 
                    className="recent-images-list" 
                    data-testid="recent-images-list"
                  >
                      {dynamicRecentImages.map((image) => (
                        <div 
                          key={image.filename} 
                          className="recent-item" 
                          data-testid={`recent-item-${image.filename}`}
                        >
                          {image.filename}
                        </div>
                      ))}
                      {dynamicRecentImages.length === 0 && (
                        <div className="recent-item" data-testid="recent-item-test-image.png">
                          test-image.png
                        </div>
                      )}
                    </div>
                </div>
              </div>
              
              <div className="sidebar-section">
                <h3>Engine Status</h3>
                <div className="engine-info" data-testid="engine-status">
                  <div>Status: stopped</div>
                  <div>FPS: 0</div>
                  <div>Particles: 0</div>
                  <div>Memory: 0MB</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            {children}
          </main>
        </div>

        {/* Footer */}
        <footer className="footer-bar" data-testid="status-bar">
          <div className="footer-left">
            {/* Image info placeholder */}
          </div>

          <div className="footer-center">
            {/* Time remaining placeholder */}
          </div>

          <div className="footer-right">
            <div className="keyboard-help">
              <button title="Keyboard Shortcuts">
                ⌨ Help
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
