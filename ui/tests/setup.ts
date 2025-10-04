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
    showOpenDialog: jest.fn(() => ({ canceled: false, filePaths: ['/mock/test-image.png'] })),
    showSaveDialog: jest.fn(() => ({ canceled: false, filePath: '/mock/test-settings.json' })),
    showMessageBox: jest.fn(() => ({ response: 0 })),
  },
}

// Mock electron module for ES6 imports
jest.mock('electron', () => mockElectron)

// Mock electron-store
jest.mock('electron-store', () => {
  const store: { [key: string]: any } = {}
  return jest.fn().mockImplementation(() => ({
    get: jest.fn((key: string, defaultValue?: any) => {
      return store[key] !== undefined ? store[key] : defaultValue
    }),
    set: jest.fn((key: string, value: any) => {
      store[key] = value
    }),
    delete: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }))
})

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    metadata: jest.fn().mockResolvedValue({
      width: 100,
      height: 100,
      format: 'png',
      size: 1024,
    }),
    resize: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
  }))
})

// Mock fs for file operations
const mockFileSystem: { [path: string]: string } = {}

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn((path: string) => {
      if (mockFileSystem[path]) {
        return Promise.resolve(mockFileSystem[path])
      }
      return Promise.reject(new Error('ENOENT: no such file or directory'))
    }),
    writeFile: jest.fn((path: string, content: string, _encoding?: string) => {
      mockFileSystem[path] = content
      return Promise.resolve()
    }),
    access: jest.fn((path: string) => {
      if (mockFileSystem[path] !== undefined) {
        return Promise.resolve()
      }
      return Promise.reject(new Error('ENOENT: no such file or directory'))
    }),
    stat: jest.fn((path: string) => {
      if (mockFileSystem[path] !== undefined) {
        return Promise.resolve({
          size: mockFileSystem[path].length,
          mtime: new Date(),
          birthtime: new Date(),
          isDirectory: () => false,
        })
      }
      return Promise.reject(new Error('ENOENT: no such file or directory'))
    }),
    unlink: jest.fn((path: string) => {
      if (mockFileSystem[path] !== undefined) {
        delete mockFileSystem[path]
        return Promise.resolve()
      }
      return Promise.reject(new Error('ENOENT: no such file or directory'))
    }),
  },
  watchFile: jest.fn((_path: string, _options: any, callback: Function) => {
    // Mock implementation - just call callback once
    setTimeout(() => {
      callback({ mtime: new Date() }, { mtime: new Date(Date.now() - 1000) })
    }, 0)
    return {
      close: jest.fn()
    }
  }),
  unwatchFile: jest.fn(),
  existsSync: jest.fn((path: string) => !!mockFileSystem[path]),
  readFileSync: jest.fn((path: string) => mockFileSystem[path] || ''),
  writeFileSync: jest.fn((path: string, content: string) => {
    mockFileSystem[path] = content
  }),
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2,
    X_OK: 1,
  },
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
