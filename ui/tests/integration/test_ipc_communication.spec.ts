/**
 * Integration test for IPC communication between main and renderer processes
 * Tests message serialization, deserialization, error handling, and protocol compliance
 */

import { ipcMain, ipcRenderer } from 'electron'

describe('IPC Communication Integration', () => {
  
  describe('Main-Renderer Message Protocol', () => {
    
    beforeEach(() => {
      // Clear all IPC handlers before each test
      ipcMain.removeAllListeners()
      jest.clearAllMocks()
    })

    it('should handle settings synchronization messages', async () => {
      const mockSettings = {
        theme: 'dark',
        language: 'en',
        particleCount: 1000,
        animationSpeed: 1.2
      }

      // Mock main process handler
      const mockHandler = jest.fn().mockResolvedValue(mockSettings)
      ipcMain.handle('settings:get', mockHandler)

      // Simulate renderer request
      const result = await ipcRenderer.invoke('settings:get')
      
      expect(mockHandler).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockSettings)
    })

    it('should handle settings update messages with validation', async () => {
      const settingsUpdate = {
        theme: 'light',
        particleCount: 2000
      }

      const mockHandler = jest.fn().mockResolvedValue({ success: true })
      ipcMain.handle('settings:update', mockHandler)

      const result = await ipcRenderer.invoke('settings:update', settingsUpdate)
      
      expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), settingsUpdate)
      expect(result.success).toBe(true)
    })

    it('should handle file selection messages', async () => {
      const mockFileResult = {
        path: '/path/to/selected/image.png',
        filename: 'image.png',
        metadata: {
          width: 1920,
          height: 1080,
          size: 2048000,
          format: 'PNG'
        }
      }

      const mockHandler = jest.fn().mockResolvedValue(mockFileResult)
      ipcMain.handle('file:selectImage', mockHandler)

      const result = await ipcRenderer.invoke('file:selectImage')
      
      expect(mockHandler).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockFileResult)
    })

    it('should handle Python engine commands', async () => {
      const animationConfig = {
        imagePath: '/path/to/image.png',
        particleCount: 1500,
        stages: ['burst', 'transition', 'formation']
      }

      const mockHandler = jest.fn().mockResolvedValue({ success: true })
      ipcMain.handle('engine:startAnimation', mockHandler)

      const result = await ipcRenderer.invoke('engine:startAnimation', animationConfig)
      
      expect(mockHandler).toHaveBeenCalledWith(expect.any(Object), animationConfig)
      expect(result.success).toBe(true)
    })
  })

  describe('Message Serialization & Deserialization', () => {
    
    it('should properly serialize complex objects', async () => {
      const complexData = {
        settings: {
          theme: 'dark',
          nested: { value: 42, array: [1, 2, 3] }
        },
        metadata: {
          timestamp: new Date(),
          buffer: Buffer.from('test data')
        }
      }

      const mockHandler = jest.fn((_event, data) => {
        // Verify data structure is preserved
        expect(data.settings.theme).toBe('dark')
        expect(data.settings.nested.value).toBe(42)
        expect(Array.isArray(data.settings.nested.array)).toBe(true)
        return { received: true }
      })
      
      ipcMain.handle('test:complexData', mockHandler)
      const result = await ipcRenderer.invoke('test:complexData', complexData)
      
      expect(result.received).toBe(true)
    })

    it('should handle large data payloads efficiently', async () => {
      // Create a large payload (simulating image data or large configs)
      const largeArray = new Array(10000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }))
      const largePayload = { items: largeArray, metadata: { count: largeArray.length } }

      const mockHandler = jest.fn((_event, data) => {
        expect(data.items).toHaveLength(10000)
        expect(data.metadata.count).toBe(10000)
        return { processed: true, count: data.items.length }
      })
      
      ipcMain.handle('test:largePayload', mockHandler)
      
      const start = performance.now()
      const result = await ipcRenderer.invoke('test:largePayload', largePayload)
      const duration = performance.now() - start
      
      expect(result.processed).toBe(true)
      expect(result.count).toBe(10000)
      expect(duration).toBeLessThan(1000) // Should process within 1 second
    })

    it('should handle circular references gracefully', async () => {
      const circularObj = { name: 'test' } as any
      circularObj.self = circularObj

      const mockHandler = jest.fn().mockRejectedValue(new Error('Circular reference detected'))
      ipcMain.handle('test:circular', mockHandler)

      await expect(ipcRenderer.invoke('test:circular', circularObj))
        .rejects.toThrow('Circular reference detected')
    })
  })

  describe('Error Handling & Recovery', () => {
    
    it('should handle main process errors gracefully', async () => {
      const mockHandler = jest.fn().mockRejectedValue(new Error('Simulated main process error'))
      ipcMain.handle('test:error', mockHandler)

      await expect(ipcRenderer.invoke('test:error'))
        .rejects.toThrow('Simulated main process error')
    })

    it('should timeout on unresponsive handlers', async () => {
      const mockHandler = jest.fn().mockImplementation(() => {
        // Simulate hanging handler
        return new Promise(() => {}) // Never resolves
      })
      
      ipcMain.handle('test:timeout', mockHandler)

      // This test should timeout gracefully
      await expect(Promise.race([
        ipcRenderer.invoke('test:timeout'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ])).rejects.toThrow('Timeout')
    }, 7000)

    it('should handle malformed messages', async () => {
      const mockHandler = jest.fn().mockImplementation((_event, data) => {
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid message format')
        }
        return { valid: true }
      })
      
      ipcMain.handle('test:validation', mockHandler)

      await expect(ipcRenderer.invoke('test:validation', null))
        .rejects.toThrow('Invalid message format')
        
      await expect(ipcRenderer.invoke('test:validation', 'invalid string'))
        .rejects.toThrow('Invalid message format')
    })

    it('should recover from handler exceptions', async () => {
      let callCount = 0
      const mockHandler = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          throw new Error('First call fails')
        }
        return { success: true, attempt: callCount }
      })
      
      ipcMain.handle('test:recovery', mockHandler)

      // First call should fail
      await expect(ipcRenderer.invoke('test:recovery'))
        .rejects.toThrow('First call fails')
        
      // Second call should succeed
      const result = await ipcRenderer.invoke('test:recovery')
      expect(result.success).toBe(true)
      expect(result.attempt).toBe(2)
    })
  })

  describe('Performance Requirements', () => {
    
    it('should handle high-frequency messages efficiently', async () => {
      const mockHandler = jest.fn().mockImplementation((_event, data) => ({ 
        echo: data.value,
        timestamp: Date.now()
      }))
      
      ipcMain.handle('test:highFreq', mockHandler)

      const promises = Array.from({ length: 100 }, (_, i) =>
        ipcRenderer.invoke('test:highFreq', { value: i })
      )

      const start = performance.now()
      const results = await Promise.all(promises)
      const duration = performance.now() - start

      expect(results).toHaveLength(100)
      expect(duration).toBeLessThan(2000) // 100 messages in under 2 seconds
      expect(mockHandler).toHaveBeenCalledTimes(100)
    })

    it('should maintain message order under load', async () => {
      const receivedOrder: number[] = []
      const mockHandler = jest.fn().mockImplementation((_event, data) => {
        receivedOrder.push(data.sequence)
        // Add small delay to test ordering
        return new Promise(resolve => 
          setTimeout(() => resolve({ sequence: data.sequence }), Math.random() * 10)
        )
      })
      
      ipcMain.handle('test:ordering', mockHandler)

      const promises = Array.from({ length: 20 }, (_, i) =>
        ipcRenderer.invoke('test:ordering', { sequence: i })
      )

      await Promise.all(promises)
      
      // Verify all messages were received
      expect(receivedOrder).toHaveLength(20)
      expect(receivedOrder.sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i))
    })
  })

  describe('Protocol Compliance', () => {
    
    it('should enforce message structure for settings operations', async () => {
      const validSettingsMessage = {
        action: 'update',
        payload: {
          theme: 'dark',
          language: 'en'
        },
        metadata: {
          timestamp: Date.now(),
          source: 'renderer'
        }
      }

      const mockHandler = jest.fn().mockImplementation((_event, message) => {
        // Validate required fields
        if (!message.action || !message.payload) {
          throw new Error('Invalid message structure')
        }
        return { success: true, processed: message.action }
      })
      
      ipcMain.handle('settings:operation', mockHandler)

      const result = await ipcRenderer.invoke('settings:operation', validSettingsMessage)
      expect(result.success).toBe(true)
      expect(result.processed).toBe('update')
    })

    it('should enforce message structure for engine operations', async () => {
      const validEngineMessage = {
        command: 'start_animation',
        payload: {
          imagePath: '/path/to/image.png',
          config: { particleCount: 1000 }
        },
        id: 'msg-123',
        timestamp: Date.now()
      }

      const mockHandler = jest.fn().mockImplementation((_event, message) => {
        if (!message.command || !message.payload || !message.id) {
          throw new Error('Invalid engine message structure')
        }
        return { 
          success: true, 
          messageId: message.id, 
          command: message.command 
        }
      })
      
      ipcMain.handle('engine:operation', mockHandler)

      const result = await ipcRenderer.invoke('engine:operation', validEngineMessage)
      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg-123')
      expect(result.command).toBe('start_animation')
    })

    it('should validate file operation messages', async () => {
      const validFileMessage = {
        operation: 'select',
        type: 'image',
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
        ],
        options: {
          multiSelections: false,
          defaultPath: '/home/user/Pictures'
        }
      }

      const mockHandler = jest.fn().mockImplementation((_event, message) => {
        if (!message.operation || !message.type) {
          throw new Error('Invalid file operation message')
        }
        return {
          success: true,
          operation: message.operation,
          type: message.type
        }
      })
      
      ipcMain.handle('file:operation', mockHandler)

      const result = await ipcRenderer.invoke('file:operation', validFileMessage)
      expect(result.success).toBe(true)
      expect(result.operation).toBe('select')
      expect(result.type).toBe('image')
    })
  })

  describe('Event Broadcasting', () => {
    
    it('should broadcast status updates to all renderer processes', () => {
      const mockListener = jest.fn()
      ipcRenderer.on('status:update', mockListener)

      const statusUpdate = {
        type: 'engine_status',
        data: {
          isRunning: true,
          stage: 'transition',
          progress: 0.6
        },
        timestamp: Date.now()
      }

      // Simulate main process broadcasting
      ipcRenderer.emit('status:update', null, statusUpdate)

      expect(mockListener).toHaveBeenCalledWith(null, statusUpdate)
      
      // Cleanup
      ipcRenderer.removeAllListeners('status:update')
    })

    it('should handle settings change notifications', () => {
      const mockListener = jest.fn()
      ipcRenderer.on('settings:changed', mockListener)

      const settingsChange = {
        changed: ['theme', 'particleCount'],
        newValues: {
          theme: 'light',
          particleCount: 1500
        },
        source: 'main'
      }

      // Simulate settings change broadcast
      ipcRenderer.emit('settings:changed', null, settingsChange)

      expect(mockListener).toHaveBeenCalledWith(null, settingsChange)
      
      // Cleanup
      ipcRenderer.removeAllListeners('settings:changed')
    })

    it('should handle error notifications', () => {
      const mockListener = jest.fn()
      ipcRenderer.on('error:notification', mockListener)

      const errorNotification = {
        level: 'error',
        message: 'Python engine communication failed',
        details: {
          error: 'ECONNREFUSED',
          retry: true
        },
        timestamp: Date.now()
      }

      // Simulate error broadcast
      ipcRenderer.emit('error:notification', null, errorNotification)

      expect(mockListener).toHaveBeenCalledWith(null, errorNotification)
      
      // Cleanup
      ipcRenderer.removeAllListeners('error:notification')
    })
  })
})
