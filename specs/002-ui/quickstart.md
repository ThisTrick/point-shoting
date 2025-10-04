# Quickstart Guide: Electron UI для системи анімації частинок

**Branch**: `002-ui` | **Generated**: 2025-09-27  
**Prerequisites**: Node.js 18+, Python 3.11+ (engine з 001-), Git

## Setup Development Environment

### 1. Project Structure Setup
```bash
# Clone або switch до UI branch
git checkout 002-ui

# Create UI project structure  
mkdir -p ui/{src/{main,renderer,shared},tests/{unit,integration,e2e},assets}

# Initialize Node.js project
cd ui/
npm init -y
```

### 2. Install Core Dependencies
```bash
# Core Electron stack
npm install --save electron@^27.0.0 react@^18.0.0 react-dom@^18.0.0
npm install --save typescript@^5.0.0 @types/react@^18.0.0 @types/node@^20.0.0

# Build tools
npm install --save-dev vite@^5.0.0 @vitejs/plugin-react@^4.0.0  
npm install --save-dev electron-builder@^24.0.0

# Testing framework
npm install --save-dev jest@^29.0.0 @testing-library/react@^14.0.0
npm install --save-dev playwright@^1.40.0 @testing-library/jest-dom@^6.0.0

# UI and utilities  
npm install --save electron-store@^8.0.0 react-i18next@^14.0.0
npm install --save @types/electron@^1.6.10
```

### 3. TypeScript Configuration
```json
// ui/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@main/*": ["main/*"],
      "@renderer/*": ["renderer/*"],  
      "@shared/*": ["shared/*"]
    }
  },
  "include": ["src/**/*"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4. Vite Configuration
```typescript
// ui/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main/main.ts'),
        renderer: resolve(__dirname, 'src/renderer/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@main': resolve(__dirname, 'src/main'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
})
```

## Initial Implementation

### 1. Main Process Setup
```typescript
// ui/src/main/main.ts
import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import Store from 'electron-store'

interface UISettings {
  windowBounds: { width: number, height: number }
  theme: 'light' | 'dark' | 'system'
  language: 'uk' | 'en'
}

const store = new Store<UISettings>({
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    theme: 'system',
    language: 'en'
  }
})

let mainWindow: BrowserWindow | null = null

const createWindow = () => {
  const settings = store.get()
  
  mainWindow = new BrowserWindow({
    ...settings.windowBounds,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    },
    show: false
  })

  // Load renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Save window bounds on resize
  mainWindow.on('resized', () => {
    if (mainWindow) {
      const bounds = mainWindow.getBounds()
      store.set('windowBounds', bounds)
    }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('get-settings', () => {
  return store.store
})

ipcMain.handle('save-settings', (_, settings: Partial<UISettings>) => {
  for (const [key, value] of Object.entries(settings)) {
    store.set(key as keyof UISettings, value)
  }
  return store.store
})

ipcMain.handle('select-image-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Select Image File',
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
    ],
    properties: ['openFile']
  })
  
  return result.canceled ? null : result.filePaths[0]
})
```

### 2. Preload Script
```typescript  
// ui/src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  
  // File operations
  selectImageFile: () => ipcRenderer.invoke('select-image-file'),
  
  // Python engine communication (placeholder)
  startEngine: () => ipcRenderer.invoke('start-engine'),
  stopEngine: () => ipcRenderer.invoke('stop-engine'),
  sendEngineCommand: (command: any) => ipcRenderer.invoke('send-engine-command', command),
  
  // Event listeners
  onEngineMessage: (callback: (message: any) => void) => {
    ipcRenderer.on('engine-message', (_, message) => callback(message))
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
```

### 3. React App Bootstrap
```tsx
// ui/src/renderer/App.tsx
import React, { useState, useEffect } from 'react'
import { MainWindow } from './components/MainWindow'
import { SettingsProvider } from './contexts/SettingsContext'
import { AnimationProvider } from './contexts/AnimationContext'
import './styles/global.css'

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Load settings
        await window.electronAPI.getSettings()
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  if (isLoading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <SettingsProvider>
      <AnimationProvider>
        <MainWindow />
      </AnimationProvider>
    </SettingsProvider>
  )
}
```

### 4. Main Window Component
```tsx
// ui/src/renderer/components/MainWindow.tsx
import React from 'react'
import { ControlPanel } from './ControlPanel'
import { AnimationViewport } from './AnimationViewport'  
import { StatusBar } from './StatusBar'
import { MenuBar } from './MenuBar'
import './MainWindow.css'

export const MainWindow: React.FC = () => {
  return (
    <div className="main-window">
      <MenuBar />
      <div className="main-content">
        <ControlPanel />
        <AnimationViewport />
      </div>
      <StatusBar />
    </div>
  )
}
```

## Development Workflow

### 1. Development Scripts
```json
// ui/package.json scripts
{
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "tsc && vite build && electron-builder",
    "build:dev": "tsc && vite build",
    "test": "jest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write src"
  }
}
```

### 2. Running Development Environment
```bash
# Terminal 1: Start UI development
cd ui/
npm run dev

# Terminal 2: Ensure Python engine available (from project root)
cd ../
uv run python -m point_shoting.cli --help

# Verify engine integration
cd ui/
npm run test
```

### 3. Testing Setup
```typescript
// ui/tests/setup.ts  
import '@testing-library/jest-dom'

// Mock Electron APIs
const mockElectronAPI = {
  getSettings: jest.fn(() => Promise.resolve({})),
  saveSettings: jest.fn(() => Promise.resolve({})),
  selectImageFile: jest.fn(() => Promise.resolve('/mock/path.png')),
  startEngine: jest.fn(() => Promise.resolve(true)),
  stopEngine: jest.fn(() => Promise.resolve()),
  sendEngineCommand: jest.fn(() => Promise.resolve()),
  onEngineMessage: jest.fn()
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
})
```

## Integration with Python Engine

### 1. Engine Bridge Implementation
```typescript
// ui/src/main/engine-bridge.ts
import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

export class PythonEngineBridge extends EventEmitter {
  private engineProcess: ChildProcess | null = null
  private isRunning = false

  async startEngine(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Spawn Python engine process
        this.engineProcess = spawn('uv', ['run', 'python', '-m', 'point_shoting.cli'], {
          cwd: '../', // Relative to UI directory
          stdio: ['pipe', 'pipe', 'pipe']
        })

        this.engineProcess.stdout?.on('data', (data) => {
          const message = this.parseEngineMessage(data.toString())
          if (message) {
            this.emit('engine-message', message)
          }
        })

        this.engineProcess.on('spawn', () => {
          this.isRunning = true
          resolve(true)
        })

        this.engineProcess.on('error', (error) => {
          this.isRunning = false
          reject(error)
        })

        // Health check timeout
        setTimeout(() => {
          if (!this.isRunning) {
            reject(new Error('Engine startup timeout'))
          }
        }, 5000)

      } catch (error) {
        reject(error)
      }
    })
  }

  async stopEngine(): Promise<void> {
    if (this.engineProcess && this.isRunning) {
      this.engineProcess.kill('SIGTERM')
      this.isRunning = false
    }
  }

  sendCommand(command: any): void {
    if (this.engineProcess && this.isRunning) {
      const message = JSON.stringify(command) + '\n'
      this.engineProcess.stdin?.write(message)
    }
  }

  private parseEngineMessage(data: string): any {
    try {
      return JSON.parse(data.trim())
    } catch (error) {
      console.error('Failed to parse engine message:', data)
      return null
    }
  }
}
```

### 2. IPC Integration
```typescript
// ui/src/main/main.ts (additional handlers)
import { PythonEngineBridge } from './engine-bridge'

const engineBridge = new PythonEngineBridge()

// Forward engine messages to renderer
engineBridge.on('engine-message', (message) => {
  mainWindow?.webContents.send('engine-message', message)
})

ipcMain.handle('start-engine', async () => {
  try {
    return await engineBridge.startEngine()
  } catch (error) {
    console.error('Failed to start engine:', error)
    return false
  }
})

ipcMain.handle('stop-engine', async () => {
  await engineBridge.stopEngine()
})

ipcMain.handle('send-engine-command', (_, command) => {
  engineBridge.sendCommand(command)
})
```

## Verification Steps

### 1. Basic Functionality Test
```bash
# Verify UI starts successfully
cd ui/
npm run dev
# → Should open Electron window з React interface

# Verify Python engine integration  
# → Click "Start Engine" button in UI
# → Should see engine status updates
```

### 2. File Operations Test
```bash
# Test image selection
# → Click "Load Image" in UI
# → Should open native file dialog
# → Select PNG/JPG file
# → Should show image preview

# Test settings persistence
# → Change some UI settings
# → Close and reopen app  
# → Settings should be restored
```

### 3. Communication Test
```bash
# Test engine communication
# → Load image through UI
# → Start animation
# → Should see status updates in UI
# → FPS counter should update
# → Pause/resume should work
```

## Next Development Steps

### Phase 1: Core UI Components
1. Implement ControlPanel з animation settings
2. Create AnimationViewport для preview  
3. Add StatusBar з metrics display
4. Build SettingsDialog з all options

### Phase 2: Engine Integration  
1. Complete PythonEngineBridge implementation
2. Add comprehensive error handling
3. Implement file validation
4. Add progress indicators

### Phase 3: Advanced Features
1. Keyboard shortcuts system
2. Preset management
3. Watermark configuration  
4. Debug HUD overlay

### Phase 4: Polish & Testing
1. Comprehensive test coverage
2. Cross-platform testing
3. Performance optimization
4. User experience refinements

Цей quickstart забезпечує solid foundation для Electron UI development з proper TypeScript setup, React integration та Python engine communication framework.
