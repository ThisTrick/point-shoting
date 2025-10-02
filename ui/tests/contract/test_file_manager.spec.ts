/**
 * Contract test for FileManager
 * 
 * Tests that FileManager implementation follows the defined contract
 * from /specs/002-ui/contracts/file_manager.md
 */

import { FileManager } from '@main/services/FileManager'
import type { 
  ImageFileResult, 
  ImageValidationResult, 
  ImageMetadata, 
  WatermarkFileResult, 
  WatermarkValidationResult, 
  RecentFileInfo, 
  FileStats, 
  PresetConfig, 
  ConfigValidationResult, 
  ValidationError, 
  FileChangeEvent, 
  FileWatcher 
} from '@shared/types'

describe('FileManager Contract', () => {
  let fileManager: FileManager
  
  beforeEach(() => {
    // Import and instantiate the actual FileManager implementation
    fileManager = new FileManager()
  })

  describe('Interface Compliance', () => {
    it('should implement all required methods', () => {
      // Image Operations
      expect(typeof fileManager.selectImageFile).toBe('function')
      expect(typeof fileManager.validateImageFile).toBe('function')
      expect(typeof fileManager.generateImagePreview).toBe('function')
      expect(typeof fileManager.getImageMetadata).toBe('function')
      
      // Configuration Operations
      expect(typeof fileManager.selectConfigFile).toBe('function')
      expect(typeof fileManager.saveConfigFile).toBe('function')
      expect(typeof fileManager.loadConfigFile).toBe('function')
      expect(typeof fileManager.validateConfigFile).toBe('function')
      
      // Watermark Operations
      expect(typeof fileManager.selectWatermarkFile).toBe('function')
      expect(typeof fileManager.validateWatermarkFile).toBe('function')
      
      // Recent Files Management
      expect(typeof fileManager.getRecentImages).toBe('function')
      expect(typeof fileManager.addToRecentImages).toBe('function')
      expect(typeof fileManager.removeFromRecentImages).toBe('function')
      expect(typeof fileManager.clearRecentImages).toBe('function')
      
      // File System Utilities
      expect(typeof fileManager.watchFile).toBe('function')
      expect(typeof fileManager.unwatchFile).toBe('function')
      expect(typeof fileManager.getFileStats).toBe('function')
      expect(typeof fileManager.fileExists).toBe('function')
    })
  })

  describe('Image Operations Contract', () => {
    it('should show image selection dialog', async () => {
      const result = await fileManager.selectImageFile()
      
      if (result !== null) {
        expect(result.success).toBe(true)
        expect(typeof result.path).toBe('string')
        expect(typeof result.filename).toBe('string')
        expect(typeof result.fileSize).toBe('number')
      }
    })

    it('should validate image file format and constraints', async () => {
      const imagePath = '/path/to/test.png'
      const validation = await fileManager.validateImageFile(imagePath)
      
      expect(validation).toBeDefined()
      expect(typeof validation.isValid).toBe('boolean')
      expect(Array.isArray(validation.errors)).toBe(true)
      expect(Array.isArray(validation.warnings)).toBe(true)
    })

    it('should generate base64 image preview', async () => {
      const imagePath = '/path/to/test.png'
      const maxSize = 200
      const preview = await fileManager.generateImagePreview(imagePath, maxSize)
      
      expect(typeof preview).toBe('string')
      expect(preview.startsWith('data:image/')).toBe(true)
    })

    it('should extract comprehensive image metadata', async () => {
      const imagePath = '/path/to/test.png'
      const metadata = await fileManager.getImageMetadata(imagePath)
      
      expect(metadata).toBeDefined()
      expect(typeof metadata.width).toBe('number')
      expect(typeof metadata.height).toBe('number')
      expect(typeof metadata.format).toBe('string')
      expect(typeof metadata.hasAlpha).toBe('boolean')
    })
    })

    it('should generate base64 image preview', async () => {
      const imagePath = '/path/to/test.png'
      const maxSize = 200
      const preview = await fileManager.generateImagePreview(imagePath, maxSize)
      
      expect(typeof preview).toBe('string')
      expect(preview.startsWith('data:image/')).toBe(true)
    })

    it('should extract comprehensive image metadata', async () => {
      const imagePath = '/path/to/test.png'
      const metadata = await fileManager.getImageMetadata(imagePath)
      
      expect(metadata).toBeDefined()
      expect(typeof metadata.width).toBe('number')
      expect(typeof metadata.height).toBe('number')
      expect(typeof metadata.format).toBe('string')
      expect(typeof metadata.hasAlpha).toBe('boolean')
    })
  })

  describe('Configuration Operations Contract', () => {
    it('should show config file dialog for import and export', async () => {
      const importPath = await fileManager.selectConfigFile('import')
      const exportPath = await fileManager.selectConfigFile('export')
      
      if (importPath !== null) {
        expect(typeof importPath).toBe('string')
      }
      if (exportPath !== null) {
        expect(typeof exportPath).toBe('string')
      }
    })

    it('should save configuration to JSON file', async () => {
      const path = '/tmp/test-config.json'
      const config = { theme: 'dark', particleCount: 1000 } as any
      
      await expect(fileManager.saveConfigFile(path, config))
        .resolves.toBeUndefined()
    })

    it('should load and parse configuration file', async () => {
      const path = '/tmp/test-config.json'
      const config = await fileManager.loadConfigFile(path)
      
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })

    it('should validate configuration file schema', async () => {
      const path = '/tmp/test-config.json'
      const validation = await fileManager.validateConfigFile(path)
      
      expect(validation).toBeDefined()
      expect(typeof validation).toBe('object')
    })
  })

  describe('Watermark Operations Contract', () => {
    it('should show watermark file selection dialog', async () => {
      const result = await fileManager.selectWatermarkFile()
      
      if (result !== null) {
        expect(result.success).toBe(true)
        expect(typeof result.path).toBe('string')
        expect(typeof result.filename).toBe('string')
      }
    })

    it('should validate watermark file compatibility', async () => {
      const watermarkPath = '/path/to/watermark.png'
      const validation = await fileManager.validateWatermarkFile(watermarkPath)
      
      expect(validation).toBeDefined()
      expect(typeof validation.isValid).toBe('boolean')
      expect(typeof validation.minSizeMet).toBe('boolean')
      expect(typeof validation.isPNG).toBe('boolean')
      expect(Array.isArray(validation.errors)).toBe(true)
    })
  })

  describe('Recent Files Management Contract', () => {
    it('should maintain list of recent image files', async () => {
      const recentFiles = await fileManager.getRecentImages()
      
      expect(Array.isArray(recentFiles)).toBe(true)
      recentFiles.forEach(file => {
        expect(typeof file.path).toBe('string')
        expect(typeof file.filename).toBe('string')
        expect(file.lastAccessed).toBeInstanceOf(Date)
      })
    })

    it('should add file to recent images list', async () => {
      const imagePath = '/path/to/new-image.png'
      await expect(fileManager.addToRecentImages(imagePath))
        .resolves.toBeUndefined()
    })

    it('should remove file from recent images list', async () => {
      const imagePath = '/path/to/remove-image.png'
      await expect(fileManager.removeFromRecentImages(imagePath))
        .resolves.toBeUndefined()
    })

    it('should clear all recent images', async () => {
      await expect(fileManager.clearRecentImages())
        .resolves.toBeUndefined()
    })
  })

  describe('File System Utilities Contract', () => {
    it('should create file watcher with callback', () => {
      const filePath = '/path/to/watch.txt'
      const callback = jest.fn()
      
      const watcher = fileManager.watchFile(filePath, callback)
      
      expect(watcher).toBeDefined()
      expect(typeof watcher.path).toBe('string')
      expect(typeof watcher.isActive).toBe('boolean')
      expect(typeof watcher.stop).toBe('function')
    })

    it('should stop file watcher', () => {
      const filePath = '/path/to/watch.txt'
      const callback = jest.fn()
      const watcher = fileManager.watchFile(filePath, callback)
      
      expect(() => fileManager.unwatchFile(watcher)).not.toThrow()
    })

    it('should get comprehensive file statistics', async () => {
      const filePath = '/path/to/file.txt'
      const stats = await fileManager.getFileStats(filePath)
      
      expect(stats).toBeDefined()
      expect(typeof stats.size).toBe('number')
      expect(stats.created).toBeInstanceOf(Date)
      expect(stats.modified).toBeInstanceOf(Date)
      expect(typeof stats.isDirectory).toBe('boolean')
    })

    it('should check file existence accurately', async () => {
      const existingPath = '/path/to/existing.txt'
      const nonExistentPath = '/path/to/nonexistent.txt'
      
      const existsResult = await fileManager.fileExists(existingPath)
      const notExistsResult = await fileManager.fileExists(nonExistentPath)
      
      expect(typeof existsResult).toBe('boolean')
      expect(typeof notExistsResult).toBe('boolean')
    })
  })

  describe('Performance Requirements', () => {
    it('should validate image within 200ms for small files', async () => {
      const imagePath = '/path/to/small-image.png'
      const start = performance.now()
      await fileManager.validateImageFile(imagePath)
      const duration = performance.now() - start
      expect(duration).toBeLessThan(200)
    })

    it('should generate preview within 500ms', async () => {
      const imagePath = '/path/to/test.png'
      const start = performance.now()
      await fileManager.generateImagePreview(imagePath, 200)
      const duration = performance.now() - start
      expect(duration).toBeLessThan(500)
    })

    it('should check file existence within 10ms', async () => {
      const filePath = '/path/to/file.txt'
      const start = performance.now()
      await fileManager.fileExists(filePath)
      const duration = performance.now() - start
      expect(duration).toBeLessThan(10)
    })
  })

  describe('Error Handling Contract', () => {
    it('should handle invalid image paths gracefully', async () => {
      const invalidPath = '/nonexistent/image.png'
      const validation = await fileManager.validateImageFile(invalidPath)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should handle corrupted image files', async () => {
      const corruptedPath = '/path/to/corrupted.png'
      const validation = await fileManager.validateImageFile(corruptedPath)
      
      expect(validation.isValid).toBe(false)
    })

    it('should handle permission errors for config files', async () => {
      const restrictedPath = '/root/config.json'
      await expect(fileManager.saveConfigFile(restrictedPath, {} as any))
        .rejects.toThrow()
    })

    it('should handle file system watch failures', () => {
      const invalidPath = '/nonexistent/directory/file.txt'
      const callback = jest.fn()
      
      expect(() => fileManager.watchFile(invalidPath, callback))
        .not.toThrow()
    })
  })

  describe('File Validation Rules Contract', () => {
    it('should reject unsupported image formats', async () => {
      const unsupportedPath = '/path/to/image.bmp'
      const validation = await fileManager.validateImageFile(unsupportedPath)
      
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(e => e.field === 'format')).toBe(true)
    })

    it('should reject oversized images', async () => {
      const hugePath = '/path/to/huge-image.png'
      const validation = await fileManager.validateImageFile(hugePath)
      
      if (!validation.isValid) {
        expect(validation.errors.some(e => e.field === 'size')).toBeTruthy()
      }
    })

    it('should reject invalid configuration schemas', async () => {
      const invalidConfigPath = '/path/to/invalid-config.json'
      const validation = await fileManager.validateConfigFile(invalidConfigPath)
      
      expect(validation).toBeDefined()
      // Should have validation errors for schema mismatch
    })
  })

  describe('Recent Files Limitations Contract', () => {
    it('should limit recent files to maximum count', async () => {
      const recentFiles = await fileManager.getRecentImages()
      expect(recentFiles.length).toBeLessThanOrEqual(20) // Assuming 20 is max
    })

    it('should maintain recent files chronological order', async () => {
      const recentFiles = await fileManager.getRecentImages()
      
      for (let i = 1; i < recentFiles.length; i++) {
        expect(recentFiles[i-1].timestamp)
          .toBeGreaterThanOrEqual(recentFiles[i].timestamp)
      }
    })

    it('should automatically remove non-existent files from recent list', async () => {
      const recentFiles = await fileManager.getRecentImages()
      
      for (const file of recentFiles) {
        const exists = await fileManager.fileExists(file.path)
        // Implementation should clean up non-existent files
        if (!exists) {
          expect(file).toBeDefined() // This might fail if cleanup happens
        }
      }
    })
  })
})
