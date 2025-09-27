import '@testing-library/jest-dom'

// Mock Electron modules for testing
const mockElectron = {
  ipcRenderer: {
    invoke: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    send: jest.fn(),
  },
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  },
  app: {
    getPath: jest.fn(() => '/mock/path'),
    getName: jest.fn(() => 'MockApp'),
    getVersion: jest.fn(() => '1.0.0'),
  },
  BrowserWindow: jest.fn(),
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
    showMessageBox: jest.fn(),
  },
}

// Make Electron available globally for tests
;(global as any).require = jest.fn((module) => {
  if (module === 'electron') {
    return mockElectron
  }
  return jest.requireActual(module)
})

// Mock file system operations
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    stat: jest.fn(),
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

// Mock path operations
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => '/' + args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
  basename: jest.fn((path) => path.split('/').pop()),
  extname: jest.fn((path) => {
    const parts = path.split('.')
    return parts.length > 1 ? '.' + parts.pop() : ''
  }),
}))

// Increase timeout for async operations
jest.setTimeout(30000)
