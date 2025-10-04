# Research: Electron-based UI для системи анімації частинок

**Branch**: `002-ui` | **Generated**: 2025-09-27  
**Input**: Технічні рішення для UI на технології VS Code (Electron)

## Technical Decisions

### Core Technology Stack
**Problem**: Потрібна cross-platform технологія для UI з нативним доступом до файлової системи  
**Decision**: Electron 27+ як основа (технологія VS Code)  
**Rationale**: 
- Встановлена екосистема (VS Code, Discord, Figma)
- Нативний доступ до файлів, процесів
- TypeScript/React expertise доступний
- Автоматичні оновлення через electron-updater
- Code signing підтримка всіх платформ

**Alternatives Considered**: Tauri (менший розмір, але складніша інтеграція з Python), Flutter Desktop (менша зрілість), Qt (C++ complexity)

### Frontend Architecture  
**Problem**: UI framework для 20+ компонентів з високою інтерактивністю  
**Decision**: React 18 + TypeScript + Vite  
**Rationale**: 
- Component reusability (кнопки, повзунки, діалоги)
- Hot reload під час розробки
- Large ecosystem (UI libraries, state management)
- Type safety з TypeScript
- Vite performance для development

**State Management**: Context API + useReducer для settings, Electron Store для persistence

### Python Engine Integration
**Problem**: Як UI комунікує з існуючим Python particle engine  
**Decision**: IPC через child_process + JSON протокол  
**Rationale**:
- Python engine залишається незалежним
- JSON messaging простий для debug
- Async communication не блокує UI  
- Error isolation (crash в engine не вбиває UI)

**Protocol Design**:
```json
// UI → Python
{"type": "start_animation", "image_path": "/path/to/image.png", "settings": {...}}
{"type": "pause", "state_id": "12345"}

// Python → UI  
{"type": "status", "stage": "CHAOS", "fps": 58, "particles": 9000}
{"type": "error", "message": "Invalid image format"}
```

### File System Integration
**Problem**: Завантаження зображень, збереження конфігурацій  
**Decision**: Electron's dialog API + Node.js fs для файлових операцій  
**Rationale**:
- Native file dialogs consistency
- Drag&drop підтримка  
- Path validation та format checking
- Secure file access through main process

### Build & Packaging
**Problem**: Cross-platform distribution з Python dependencies  
**Decision**: electron-builder + Python bundling strategy  
**Rationale**:
- Auto-updater integration
- Code signing для macOS/Windows
- Python engine як embedded resource або separate install

**Distribution Strategy**: 
- Windows: NSIS installer з Python embedded
- macOS: DMG з notarization
- Linux: AppImage або deb/rpm

### Testing Strategy
**Problem**: UI components + Electron integration + Python communication  
**Decision**: Multi-layer testing approach  
**Rationale**:
- Jest + React Testing Library для components
- Playwright для E2E user scenarios  
- Mock IPC для isolated component tests
- Integration tests з real Python engine

**Test Categories**:
1. **Unit**: Individual React components
2. **Integration**: IPC communication, file operations
3. **E2E**: Complete user workflows
4. **Visual**: Screenshot regression для UI consistency

### Performance Considerations
**Problem**: UI responsiveness під час intensive Python operations  
**Decision**: Async IPC + progress indicators + debounced updates  
**Rationale**:
- Non-blocking communication
- User feedback during long operations
- Smooth animations навіть під навантаженням

**Optimizations**:
- Settings changes debounced до 300ms
- Progress updates throttled до 60fps
- Lazy loading для heavy components
- Memory management для images

### Security & Privacy
**Problem**: Local file access, process communication, auto-updates  
**Decision**: Principle of least privilege + opt-in telemetry  
**Rationale**:
- Main process handles file operations
- Renderer process sandboxed  
- No network access за замовчуванням
- Crash reports тільки з дозволу

**Security Measures**:
- Context isolation enabled
- Node integration disabled в renderer
- CSP headers для web content
- Signed updates verification

## Development Workflow

### Project Structure
```
ui/                          # Electron app root
├── src/
│   ├── main/               # Main process (Node.js)  
│   │   ├── main.ts         # App initialization
│   │   ├── ipc-handlers.ts # Python communication
│   │   └── file-manager.ts # File operations
│   ├── renderer/           # Renderer process (React)
│   │   ├── components/     # UI components  
│   │   ├── hooks/          # Custom React hooks
│   │   ├── stores/         # State management
│   │   └── types/          # TypeScript definitions
│   └── shared/             # Common types/utilities
├── tests/
│   ├── unit/              # Component tests
│   ├── integration/       # IPC, file tests  
│   └── e2e/              # Playwright tests
├── assets/               # Icons, images
├── dist/                 # Built files
└── release/              # Packaged apps
```

### Integration Points
1. **Settings Synchronization**: UI settings → Python engine parameters
2. **File Path Communication**: Image selection → Python engine loading  
3. **Status Updates**: Python stages → UI progress display
4. **Error Handling**: Python errors → UI notifications
5. **Debug Information**: Python metrics → UI HUD overlay

### Development Environment
- **Hot Reload**: Vite dev server для renderer, nodemon для main
- **DevTools**: Electron DevTools + React DevTools
- **Debugging**: VSCode debugging config для обох processes
- **Linting**: ESLint + Prettier + TypeScript strict mode

## Dependencies Analysis

### Core Dependencies
- `electron@^27.0.0` - Main framework
- `react@^18.0.0` - UI framework  
- `typescript@^5.0.0` - Type safety
- `vite@^5.0.0` - Bundling та dev server

### Build Dependencies  
- `electron-builder@^24.0.0` - Packaging
- `@types/node` - Node.js types
- `@vitejs/plugin-react` - React integration

### Testing Dependencies
- `jest@^29.0.0` + `@testing-library/react` 
- `playwright@^1.40.0` - E2E testing
- `@electron/notarize` - macOS notarization

### UI Dependencies  
- `@electron/remote` - Main/renderer communication (deprecated, use IPC)
- `electron-store` - Settings persistence
- `react-i18next` - Localization
- UI component library (TBD: Ant Design, Chakra UI, або custom)

## Risk Mitigation

### Technical Risks
1. **Python Engine Communication**: Mock interfaces для development без engine
2. **Cross-Platform Packaging**: CI matrix testing на всі ОС
3. **Performance Degradation**: Profiling tools та benchmarks  
4. **Security Vulnerabilities**: Regular dependency updates, security scans

### User Experience Risks
1. **Learning Curve**: Tooltips, help system, guided tour
2. **Platform Differences**: Native UI patterns для кожної ОС
3. **Error Recovery**: Graceful fallbacks, clear error messages

## Conclusion

Electron-based UI забезпечує:
✅ Cross-platform compatibility (Windows/macOS/Linux)
✅ Rapid development з React ecosystem  
✅ Native integration (files, notifications, updates)
✅ Mature tooling та community support
✅ Clear separation від Python engine

Основні challenges:
⚠️ Bundle size (Electron overhead ~150MB base)
⚠️ Python engine integration complexity  
⚠️ Cross-platform testing requirements
⚠️ Security considerations для desktop app

**Ready for Phase 1**: Architecture та tech stack визначені, dependencies identified, integration strategy clear.
