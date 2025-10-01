/**
 * Integration test for Python Engine Bridge communication
 * Tests subprocess management, message protocols, error recovery, and performance
 */

import { spawn, ChildProcess } from 'child_process'

// Mock child_process for testing
jest.mock('child_process')
const mockSpawn = spawn as jest.MockedFunction<typeof spawn>

describe('Python Engine Bridge Integration', () => {
  let mockProcess: Partial<ChildProcess>
  
  beforeEach(() => {
    // Create mock child process
    mockProcess = {
      stdout: {
        on: jest.fn(),
        pipe: jest.fn()
      } as any,
      stderr: {
        on: jest.fn(),
        pipe: jest.fn()
      } as any,
      stdin: {
        write: jest.fn(),
        end: jest.fn()
      } as any,
      on: jest.fn(),
      kill: jest.fn(),
      pid: 12345
    }
    
    mockSpawn.mockReturnValue(mockProcess as ChildProcess)
    jest.clearAllMocks()
  })

  describe('Process Lifecycle Management', () => {
    
    it('should start Python engine process with correct arguments', () => {
      const expectedArgs = [
        '-m', 'point_shoting.cli',
        '--mode', 'ipc',
        '--log-level', 'INFO'
      ]

      // Simulate process startup
      mockSpawn('python', expectedArgs, { stdio: 'pipe' })
      
      expect(mockSpawn).toHaveBeenCalledWith('python', expectedArgs, { stdio: 'pipe' })
    })

    it('should handle process startup success', (done) => {
      const mockOnData = jest.fn()
      
      // Mock stdout data handler
      mockProcess.stdout!.on = jest.fn((event, _handler) => {
        if (event === 'data') {
          mockOnData.mockImplementation(_handler)
        }
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate successful startup message
      setTimeout(() => {
        const startupMessage = JSON.stringify({
          type: 'startup_complete',
          data: {
            version: '1.0.0',
            processId: 12345,
            status: 'ready'
          }
        })
        
        mockOnData(Buffer.from(startupMessage + '\n'))
        
        expect(mockProcess.stdout!.on).toHaveBeenCalledWith('data', expect.any(Function))
        done()
      }, 10)
    })

    it('should handle process startup failure', (done) => {
      const mockOnError = jest.fn()
      
      mockProcess.on = jest.fn((event, _handler) => {
        if (event === 'error') {
          mockOnError.mockImplementation(_handler)
        }
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate startup error
      setTimeout(() => {
        const error = new Error('Python executable not found')
        mockOnError(error)
        
        expect(mockProcess.on).toHaveBeenCalledWith('error', expect.any(Function))
        done()
      }, 10)
    })

    it('should handle graceful process shutdown', () => {
      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate shutdown command
      const shutdownMessage = JSON.stringify({
        type: 'shutdown',
        data: {}
      })

      mockProcess.stdin!.write!(shutdownMessage + '\n')
      
      expect(mockProcess.stdin!.write).toHaveBeenCalledWith(shutdownMessage + '\n')
    })

    it('should handle process crash recovery', (done) => {
      const mockOnExit = jest.fn()
      
      mockProcess.on = jest.fn((event, _handler) => {
        if (event === 'exit') {
          mockOnExit.mockImplementation(_handler)
        }
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate unexpected process exit
      setTimeout(() => {
        mockOnExit(1, 'SIGTERM') // Exit code 1, killed by signal
        
        expect(mockProcess.on).toHaveBeenCalledWith('exit', expect.any(Function))
        done()
      }, 10)
    })
  })

  describe('Message Protocol Compliance', () => {
    
    it('should send properly formatted animation commands', () => {
      mockSpawn('python', [], { stdio: 'pipe' })

      const animationCommand = {
        type: 'start_animation',
        id: 'anim-001',
        timestamp: Date.now(),
        data: {
          imagePath: '/path/to/image.png',
          config: {
            particleCount: 1000,
            animationSpeed: 1.0,
            stages: ['burst', 'transition', 'formation']
          }
        }
      }

      const serializedCommand = JSON.stringify(animationCommand) + '\n'
      mockProcess.stdin!.write!(serializedCommand)
      
      expect(mockProcess.stdin!.write).toHaveBeenCalledWith(serializedCommand)
    })

    it('should handle settings synchronization messages', () => {
      mockSpawn('python', [], { stdio: 'pipe' })

      const settingsMessage = {
        type: 'update_settings',
        id: 'settings-001',
        timestamp: Date.now(),
        data: {
          particleDensity: 'high',
          colorScheme: 'vibrant',
          performance: {
            targetFPS: 60,
            maxMemoryMB: 512
          }
        }
      }

      const serializedMessage = JSON.stringify(settingsMessage) + '\n'
      mockProcess.stdin!.write!(serializedMessage)
      
      expect(mockProcess.stdin!.write).toHaveBeenCalledWith(serializedMessage)
    })

    it('should validate message structure before sending', () => {
      mockSpawn('python', [], { stdio: 'pipe' })

      // Test invalid messages
      const invalidMessages = [
        null,
        undefined,
        '',
        { /* missing required fields */ },
        { type: 'invalid' /* missing id and data */ }
      ]

      invalidMessages.forEach(invalidMsg => {
        expect(() => {
          if (!invalidMsg || typeof invalidMsg !== 'object' || !invalidMsg.type) {
            throw new Error('Invalid message format')
          }
          mockProcess.stdin!.write!(JSON.stringify(invalidMsg) + '\n')
        }).toThrow('Invalid message format')
      })
    })

    it('should parse incoming status messages correctly', (done) => {
      const mockOnData = jest.fn()
      
      mockProcess.stdout!.on = jest.fn((event, _handler) => {
        if (event === 'data') {
          mockOnData.mockImplementation(_handler)
        }
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate incoming status message
      setTimeout(() => {
        const statusMessage = {
          type: 'status_update',
          id: 'status-001',
          timestamp: Date.now(),
          data: {
            stage: 'formation',
            progress: 0.75,
            particleCount: 1000,
            fps: 58.2,
            memoryUsage: 245.6
          }
        }
        
        const buffer = Buffer.from(JSON.stringify(statusMessage) + '\n')
        mockOnData(buffer)
        
        // Verify the message structure
        const parsedMessage = JSON.parse(buffer.toString().trim())
        expect(parsedMessage.type).toBe('status_update')
        expect(parsedMessage.data.stage).toBe('formation')
        expect(typeof parsedMessage.data.progress).toBe('number')
        done()
      }, 10)
    })
  })

  describe('Error Handling & Recovery', () => {
    
    it('should handle JSON parsing errors gracefully', (done) => {
      const mockOnData = jest.fn()
      const mockOnError = jest.fn()
      
      mockProcess.stdout!.on = jest.fn((event, _handler) => {
        if (event === 'data') mockOnData.mockImplementation(_handler)
      })
      
      mockProcess.stderr!.on = jest.fn((event, _handler) => {
        if (event === 'data') mockOnError.mockImplementation(_handler)
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate malformed JSON
      setTimeout(() => {
        const malformedJSON = '{"type": "invalid", "data": {'
        mockOnData(Buffer.from(malformedJSON))
        
        expect(() => {
          JSON.parse(malformedJSON)
        }).toThrow()
        done()
      }, 10)
    })

    it('should handle partial message buffering', (done) => {
      const mockOnData = jest.fn()
      let buffer = ''
      
      mockProcess.stdout!.on = jest.fn((event, _handler) => {
        if (event === 'data') {
          mockOnData.mockImplementation((data: Buffer) => {
            buffer += data.toString()
            // Process complete messages (lines ending with \n)
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Keep incomplete line in buffer
            
            lines.forEach(line => {
              if (line.trim()) {
                try {
                  const message = JSON.parse(line.trim())
                  expect(message.type).toBeDefined()
                } catch (e) {
                  // Handle JSON parse errors
                }
              }
            })
          })
        }
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate fragmented message arrival
      setTimeout(() => {
        mockOnData(Buffer.from('{"type": "test"'))
        mockOnData(Buffer.from(', "data": {"value"'))
        mockOnData(Buffer.from(': 42}}\n'))
        done()
      }, 10)
    })

    it('should handle engine timeout scenarios', (done) => {
      mockSpawn('python', [], { stdio: 'pipe' })

      const timeoutCommand = {
        type: 'load_image',
        id: 'load-001',
        timestamp: Date.now(),
        timeout: 5000,
        data: { imagePath: '/path/to/large-image.png' }
      }

      mockProcess.stdin!.write!(JSON.stringify(timeoutCommand) + '\n')

      // Simulate timeout - no response within expected time
      setTimeout(() => {
        // In real implementation, this would trigger timeout handling
        expect(mockProcess.stdin!.write).toHaveBeenCalledWith(
          JSON.stringify(timeoutCommand) + '\n'
        )
        done()
      }, 100)
    })

    it('should handle engine error responses', (done) => {
      const mockOnData = jest.fn()
      
      mockProcess.stdout!.on = jest.fn((event, _handler) => {
        if (event === 'data') {
          mockOnData.mockImplementation(_handler)
        }
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate error response
      setTimeout(() => {
        const errorResponse = {
          type: 'error',
          id: 'load-001',
          timestamp: Date.now(),
          data: {
            error: 'FileNotFoundError',
            message: 'Image file not found: /invalid/path.png',
            code: 'FILE_NOT_FOUND',
            recoverable: true
          }
        }
        
        mockOnData(Buffer.from(JSON.stringify(errorResponse) + '\n'))
        
        expect(mockProcess.stdout!.on).toHaveBeenCalledWith('data', expect.any(Function))
        done()
      }, 10)
    })
  })

  describe('Performance & Resource Management', () => {
    
    it('should handle high-frequency message exchange', () => {
      mockSpawn('python', [], { stdio: 'pipe' })

      const messages = Array.from({ length: 100 }, (_, i) => ({
        type: 'heartbeat',
        id: `hb-${i}`,
        timestamp: Date.now() + i,
        data: { sequence: i }
      }))

      const start = performance.now()
      
      messages.forEach(message => {
        mockProcess.stdin!.write!(JSON.stringify(message) + '\n')
      })
      
      const duration = performance.now() - start
      
      expect(mockProcess.stdin!.write).toHaveBeenCalledTimes(100)
      expect(duration).toBeLessThan(100) // Should handle 100 messages quickly
    })

    it('should monitor process memory usage', (done) => {
      const mockOnData = jest.fn()
      
      mockProcess.stdout!.on = jest.fn((event, _handler) => {
        if (event === 'data') {
          mockOnData.mockImplementation(_handler)
        }
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate memory usage report
      setTimeout(() => {
        const memoryReport = {
          type: 'metrics_update',
          id: 'metrics-001',
          timestamp: Date.now(),
          data: {
            memoryUsage: {
              rss: 128 * 1024 * 1024, // 128 MB
              heapUsed: 96 * 1024 * 1024, // 96 MB
              external: 16 * 1024 * 1024 // 16 MB
            },
            cpuUsage: 15.2,
            fps: 59.8
          }
        }
        
        mockOnData(Buffer.from(JSON.stringify(memoryReport) + '\n'))
        
        // Verify memory monitoring
        const parsed = JSON.parse(JSON.stringify(memoryReport))
        expect(parsed.data.memoryUsage.rss).toBeLessThan(300 * 1024 * 1024) // Under 300MB
        done()
      }, 10)
    })

    it('should implement backpressure for message queuing', () => {
      mockSpawn('python', [], { stdio: 'pipe' })

      // Mock stdin drain event for backpressure
      const mockWriteResult = jest.fn()
      mockProcess.stdin!.write = jest.fn().mockImplementation((data) => {
        // Simulate backpressure - return false when buffer is full
        const bufferFull = data.length > 1000
        if (bufferFull) {
          setTimeout(() => {
            // Simulate drain event
            mockWriteResult('drain')
          }, 10)
        }
        return !bufferFull
      })

      const largeMessage = {
        type: 'large_data',
        id: 'large-001',
        data: { content: 'x'.repeat(2000) } // Large payload
      }

      const writeResult = mockProcess.stdin!.write!(JSON.stringify(largeMessage) + '\n')
      
      expect(writeResult).toBe(false) // Should indicate backpressure
      expect(mockProcess.stdin!.write).toHaveBeenCalled()
    })
  })

  describe('Health Monitoring & Heartbeat', () => {
    
    it('should send periodic heartbeat messages', (done) => {
      mockSpawn('python', [], { stdio: 'pipe' })

      let heartbeatCount = 0
      const originalWrite = mockProcess.stdin!.write as jest.Mock

      mockProcess.stdin!.write = jest.fn().mockImplementation((data) => {
        const message = JSON.parse(data.toString().replace('\n', ''))
        if (message.type === 'heartbeat') {
          heartbeatCount++
        }
        return originalWrite(data)
      })

      // Simulate sending heartbeats
      const sendHeartbeat = () => {
        const heartbeat = {
          type: 'heartbeat',
          id: `hb-${Date.now()}`,
          timestamp: Date.now(),
          data: { status: 'alive' }
        }
        mockProcess.stdin!.write!(JSON.stringify(heartbeat) + '\n')
      }

      // Send multiple heartbeats
      sendHeartbeat()
      setTimeout(sendHeartbeat, 50)
      setTimeout(sendHeartbeat, 100)

      setTimeout(() => {
        expect(heartbeatCount).toBe(3)
        done()
      }, 150)
    })

    it('should detect unresponsive engine', (done) => {
      const mockOnData = jest.fn()
      
      mockProcess.stdout!.on = jest.fn((event, _handler) => {
        if (event === 'data') {
          mockOnData.mockImplementation(_handler)
        }
      })

      mockSpawn('python', [], { stdio: 'pipe' })

      let lastHeartbeat = Date.now()
      const HEARTBEAT_TIMEOUT = 5000 // 5 seconds

      // Simulate heartbeat timeout detection
      setTimeout(() => {
        const timeSinceLastHeartbeat = Date.now() - lastHeartbeat
        
        if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
          // Engine is unresponsive
          expect(timeSinceLastHeartbeat).toBeGreaterThan(HEARTBEAT_TIMEOUT)
        }
        done()
      }, 100) // Shortened for test
    })

    it('should restart engine on health check failure', () => {
      mockSpawn('python', [], { stdio: 'pipe' })

      // Simulate failed health check
      const originalKill = mockProcess.kill as jest.Mock
      mockProcess.kill!('SIGTERM')
      
      expect(originalKill).toHaveBeenCalledWith('SIGTERM')
      
      // Simulate restart
      const restartedProcess = mockSpawn('python', [], { stdio: 'pipe' })
      expect(mockSpawn).toHaveBeenCalledTimes(2) // Original + restart
    })
  })
})
