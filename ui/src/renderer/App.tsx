/**
 * Main Application Component
 * 
 * Root React component that integrates all UI components into a cohesive
 * desktop animation application.
 */

import { MainLayout } from './components/MainLayout';
import { ImagePreview } from './components/ImagePreview';
import { ControlPanel } from './components/ControlPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { EngineState, ParticleDensity, AnimationSpeed, TransitionStyle, ColorMappingMode, UISettings, AnimationConfig, UITheme } from '../types/core';
import { useState } from 'react';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [uiSettings, setUISettings] = useState<UISettings>({
    theme: UITheme.DARK,
    language: 'en',
    showAdvancedControls: false,
    enableKeyboardShortcuts: true,
    autoSaveSettings: true
  });
  
  const [animationConfig, setAnimationConfig] = useState<AnimationConfig>({
    density: ParticleDensity.MEDIUM,
    speed: AnimationSpeed.NORMAL,
    transitionStyle: TransitionStyle.SMOOTH,
    colorMapping: ColorMappingMode.ORIGINAL,
    enableEffects: true,
    enableWatermark: false,
    particleCount: 1000
  });

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleSettingsClose = () => {
    setShowSettings(false);
  };

  return (
    <div className="app">
      <MainLayout onSettingsClick={handleSettingsClick}>
        <div className="main-app-content">
          <ImagePreview />
          <ControlPanel
            engineStatus={{
              status: EngineState.STOPPED,
              fps: 0,
              particleCount: 0,
              memoryUsage: 0,
              lastUpdate: Date.now(),
              version: '1.0.0'
            }}
            animationConfig={animationConfig}
            onConfigChange={() => {}}
            onStart={() => {}}
            onPause={() => {}}
            onResume={() => {}}
            onStop={() => {}}
            onSkip={() => {}}
          />
        </div>
      </MainLayout>
      
      <SettingsPanel
        isVisible={showSettings}
        uiSettings={uiSettings}
        animationConfig={animationConfig}
        onClose={handleSettingsClose}
        onUISettingsChange={(settings: Partial<UISettings>) => setUISettings(prev => ({ ...prev, ...settings }))}
        onAnimationConfigChange={(config: Partial<AnimationConfig>) => setAnimationConfig(prev => ({ ...prev, ...config }))}
        onReset={() => {}}
        onExport={() => {}}
        onImport={() => {}}
      />
    </div>
  );
}

export default App;
