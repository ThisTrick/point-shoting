# Tasks: Electron UI для системи анімації частинок

**Input**: Design documents from `/home/den/git/point-shoting/specs/002-ui/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: Electron 27+ + TypeScript 5.0+ + React 18+ + Node.js 18+
   → Structure: Desktop application з Python engine integration
2. Load design documents ✅:
   → data-model.md: 7 core entities (UISettings, AnimationState, etc.)
   → contracts/: 4 service contracts (MainWindow, Settings, Engine, Files)
   → research.md: Electron stack decisions, IPC protocol design
   → quickstart.md: Working examples та development setup
3. Generate tasks by category:
   → Setup: Electron project init, TypeScript config, build pipeline
   → Tests: 4 contract tests, integration tests, E2E scenarios
   → Core: TypeScript models, service implementations, React components
   → Integration: IPC communication, Python bridge, file operations
   → Polish: unit tests, cross-platform builds, performance optimization
4. Task rules applied:
   → Different files = marked [P] for parallel execution
   → Contract tests before implementations (TDD approach)
   → Models before services, services before UI components
5. Tasks numbered T001-T085 (85 total tasks)
6. Dependencies mapped з clear execution order
7. Parallel execution examples provided
8. Validation complete:
   → 4 contracts → 4 contract tests ✅
   → 7 entities → 7 model tasks ✅
   → All UI components covered ✅
9. SUCCESS: Tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths relative to `ui/` directory (Electron app root)

## Path Conventions
**Desktop Electron app structure**:
```
ui/                          # Electron app root
├── src/
│   ├── main/               # Main process (Node.js)  
│   ├── renderer/           # Renderer process (React)
│   └── shared/             # Common types/utilities
├── tests/
│   ├── contract/           # Contract compliance tests
│   ├── integration/        # Cross-component tests
│   ├── unit/              # Component-specific tests
│   └── e2e/               # End-to-end Playwright tests
└── dist/                  # Built application
```

## Phase 3.1: Project Setup

- [x] **T001** Create Electron project structure per quickstart guide in `ui/` directory
- [x] **T002** Initialize Node.js project with TypeScript, Electron, React dependencies in `ui/package.json`
- [x] **T003** [P] Configure TypeScript compiler settings in `ui/tsconfig.json`
- [x] **T004** [P] Configure Vite build tool for Electron in `ui/vite.config.ts`
- [x] **T005** [P] Configure ESLint and Prettier for code quality in `ui/.eslintrc.js`
- [x] **T006** [P] Configure Jest testing framework in `ui/jest.config.js`
- [x] **T007** [P] Configure Playwright E2E testing in `ui/playwright.config.ts`
- [x] **T008** [P] Set up electron-builder for packaging in `ui/electron-builder.yml`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [P] - Can run in parallel
- [ ] **T009** [P] Contract test MainWindowController in `ui/tests/contract/test_main_window_controller.spec.ts`
- [ ] **T010** [P] Contract test SettingsManager in `ui/tests/contract/test_settings_manager.spec.ts`
- [ ] **T011** [P] Contract test PythonEngineBridge in `ui/tests/contract/test_python_engine_bridge.spec.ts`
- [ ] **T012** [P] Contract test FileManager in `ui/tests/contract/test_file_manager.spec.ts`

### Integration Tests [P] - Can run in parallel
- [ ] **T013** [P] Integration test image loading workflow in `ui/tests/integration/test_image_loading.spec.ts`
- [ ] **T014** [P] Integration test animation control workflow in `ui/tests/integration/test_animation_control.spec.ts`
- [ ] **T015** [P] Integration test settings persistence in `ui/tests/integration/test_settings_persistence.spec.ts`
- [ ] **T016** [P] Integration test engine communication in `ui/tests/integration/test_engine_communication.spec.ts`
- [ ] **T017** [P] Integration test file operations in `ui/tests/integration/test_file_operations.spec.ts`

### E2E Scenario Tests [P] - Can run in parallel
- [ ] **T018** [P] E2E test complete animation workflow in `ui/tests/e2e/test_animation_workflow.spec.ts`
- [ ] **T019** [P] E2E test settings management workflow in `ui/tests/e2e/test_settings_workflow.spec.ts`
- [ ] **T020** [P] E2E test error handling scenarios in `ui/tests/e2e/test_error_handling.spec.ts`

## Phase 3.3: Core Models (ONLY after tests are failing)

### TypeScript Data Models [P] - Can run in parallel
- [ ] **T021** [P] UISettings model with validation in `ui/src/shared/models/UISettings.ts`
- [ ] **T022** [P] AnimationState model in `ui/src/shared/models/AnimationState.ts`
- [ ] **T023** [P] ImageInfo model with metadata in `ui/src/shared/models/ImageInfo.ts`
- [ ] **T024** [P] WatermarkInfo model in `ui/src/shared/models/WatermarkInfo.ts`
- [ ] **T025** [P] NotificationMessage model in `ui/src/shared/models/NotificationMessage.ts`
- [ ] **T026** [P] IPCMessage protocol types in `ui/src/shared/models/IPCMessage.ts`
- [ ] **T027** [P] KeyboardShortcut model in `ui/src/shared/models/KeyboardShortcut.ts`

### Utility Classes [P] - Can run in parallel  
- [ ] **T028** [P] Validation utilities in `ui/src/shared/utils/validation.ts`
- [ ] **T029** [P] File path utilities in `ui/src/shared/utils/file-utils.ts`
- [ ] **T030** [P] IPC message helpers in `ui/src/shared/utils/ipc-utils.ts`

## Phase 3.4: Main Process Services

### Core Services (Sequential - shared state dependencies)
- [ ] **T031** SettingsManager implementation in `ui/src/main/services/SettingsManager.ts`
- [ ] **T032** FileManager implementation in `ui/src/main/services/FileManager.ts`
- [ ] **T033** PythonEngineBridge implementation in `ui/src/main/services/PythonEngineBridge.ts`
- [ ] **T034** MainWindowController implementation in `ui/src/main/MainWindowController.ts`

### IPC Handlers [P] - Can run in parallel
- [ ] **T035** [P] Settings IPC handlers in `ui/src/main/ipc/settings-handlers.ts`
- [ ] **T036** [P] File operation IPC handlers in `ui/src/main/ipc/file-handlers.ts`
- [ ] **T037** [P] Engine communication IPC handlers in `ui/src/main/ipc/engine-handlers.ts`
- [ ] **T038** [P] Window management IPC handlers in `ui/src/main/ipc/window-handlers.ts`

### Main Process Entry Point
- [ ] **T039** Main process entry point in `ui/src/main/main.ts`
- [ ] **T040** Preload script with context bridge in `ui/src/main/preload.ts`

## Phase 3.5: Renderer Process (React UI)

### Context Providers [P] - Can run in parallel
- [ ] **T041** [P] SettingsContext provider in `ui/src/renderer/contexts/SettingsContext.tsx`
- [ ] **T042** [P] AnimationContext provider in `ui/src/renderer/contexts/AnimationContext.tsx`
- [ ] **T043** [P] NotificationContext provider in `ui/src/renderer/contexts/NotificationContext.tsx`

### Custom React Hooks [P] - Can run in parallel
- [ ] **T044** [P] useSettings hook in `ui/src/renderer/hooks/useSettings.ts`
- [ ] **T045** [P] useAnimationState hook in `ui/src/renderer/hooks/useAnimationState.ts`
- [ ] **T046** [P] useFileOperations hook in `ui/src/renderer/hooks/useFileOperations.ts`
- [ ] **T047** [P] useKeyboardShortcuts hook in `ui/src/renderer/hooks/useKeyboardShortcuts.ts`

### Core UI Components [P] - Can run in parallel
- [ ] **T048** [P] MainWindow component in `ui/src/renderer/components/MainWindow.tsx`
- [ ] **T049** [P] MenuBar component in `ui/src/renderer/components/MenuBar.tsx`
- [ ] **T050** [P] ControlPanel component in `ui/src/renderer/components/ControlPanel.tsx`
- [ ] **T051** [P] AnimationViewport component in `ui/src/renderer/components/AnimationViewport.tsx`
- [ ] **T052** [P] StatusBar component in `ui/src/renderer/components/StatusBar.tsx`

### Settings UI Components [P] - Can run in parallel
- [ ] **T053** [P] SettingsDialog component in `ui/src/renderer/components/SettingsDialog.tsx`
- [ ] **T054** [P] AnimationSettings panel in `ui/src/renderer/components/settings/AnimationSettings.tsx`
- [ ] **T055** [P] AppearanceSettings panel in `ui/src/renderer/components/settings/AppearanceSettings.tsx`
- [ ] **T056** [P] KeyboardSettings panel in `ui/src/renderer/components/settings/KeyboardSettings.tsx`
- [ ] **T057** [P] PresetManager component in `ui/src/renderer/components/settings/PresetManager.tsx`

### Control Components [P] - Can run in parallel
- [ ] **T058** [P] ImageLoader component in `ui/src/renderer/components/controls/ImageLoader.tsx`
- [ ] **T059** [P] AnimationControls component in `ui/src/renderer/components/controls/AnimationControls.tsx`
- [ ] **T060** [P] ParameterSliders component in `ui/src/renderer/components/controls/ParameterSliders.tsx`
- [ ] **T061** [P] BackgroundSelector component in `ui/src/renderer/components/controls/BackgroundSelector.tsx`
- [ ] **T062** [P] WatermarkConfig component in `ui/src/renderer/components/controls/WatermarkConfig.tsx`

### Utility Components [P] - Can run in parallel
- [ ] **T063** [P] NotificationContainer component in `ui/src/renderer/components/NotificationContainer.tsx`
- [ ] **T064** [P] LoadingIndicator component in `ui/src/renderer/components/LoadingIndicator.tsx`
- [ ] **T065** [P] DebugHUD overlay component in `ui/src/renderer/components/DebugHUD.tsx`
- [ ] **T066** [P] FileDropZone component in `ui/src/renderer/components/FileDropZone.tsx`

### Renderer Entry Point
- [ ] **T067** React application entry in `ui/src/renderer/App.tsx`
- [ ] **T068** HTML template and renderer bootstrap in `ui/src/renderer/index.html`

## Phase 3.6: Styling and Localization

### Styling [P] - Can run in parallel
- [ ] **T069** [P] Global CSS styles in `ui/src/renderer/styles/global.css`
- [ ] **T070** [P] Component-specific CSS modules as needed
- [ ] **T071** [P] Theme system (light/dark/system) in `ui/src/renderer/styles/themes.css`

### Internationalization [P] - Can run in parallel
- [ ] **T072** [P] i18n configuration in `ui/src/renderer/i18n/config.ts`
- [ ] **T073** [P] English translations in `ui/src/renderer/i18n/locales/en.json`
- [ ] **T074** [P] Ukrainian translations in `ui/src/renderer/i18n/locales/uk.json`

## Phase 3.7: Integration and Polish

### Cross-Component Integration (Sequential - integration dependencies)
- [ ] **T075** Integrate all components into working application
- [ ] **T076** Implement keyboard shortcuts system
- [ ] **T077** Add comprehensive error boundaries and error handling
- [ ] **T078** Implement performance monitoring and optimization

### Unit Tests for Components [P] - Can run in parallel
- [ ] **T079** [P] Unit tests for React components in `ui/tests/unit/components/`
- [ ] **T080** [P] Unit tests for hooks in `ui/tests/unit/hooks/`
- [ ] **T081** [P] Unit tests for utilities in `ui/tests/unit/utils/`

### Build and Packaging
- [ ] **T082** Configure cross-platform builds (Windows/macOS/Linux)
- [ ] **T083** Set up code signing for releases
- [ ] **T084** Create installer packages for each platform
- [ ] **T085** Verify end-to-end integration with Python engine from 001-

## Dependencies

### Phase Dependencies
- **Setup (T001-T008)** before everything else
- **Tests (T009-T020)** before implementation (TDD approach)
- **Models (T021-T030)** before services that use them
- **Main Services (T031-T040)** before renderer components
- **React Components (T041-T068)** can be parallel within groups
- **Polish (T075-T085)** after all implementation complete

### Key Blocking Dependencies
- T001-T008 → T009-T020 (setup before tests)
- T021-T030 → T031-T034 (models before services)
- T031-T034 → T041-T068 (services before UI)
- T075 blocks T079-T085 (integration before testing/packaging)

## Parallel Execution Examples

### Contract Tests (can run simultaneously)
```
Task: "Contract test MainWindowController in ui/tests/contract/test_main_window_controller.spec.ts"
Task: "Contract test SettingsManager in ui/tests/contract/test_settings_manager.spec.ts" 
Task: "Contract test PythonEngineBridge in ui/tests/contract/test_python_engine_bridge.spec.ts"
Task: "Contract test FileManager in ui/tests/contract/test_file_manager.spec.ts"
```

### Data Models (can run simultaneously)  
```
Task: "UISettings model with validation in ui/src/shared/models/UISettings.ts"
Task: "AnimationState model in ui/src/shared/models/AnimationState.ts"
Task: "ImageInfo model with metadata in ui/src/shared/models/ImageInfo.ts"
Task: "WatermarkInfo model in ui/src/shared/models/WatermarkInfo.ts"
Task: "NotificationMessage model in ui/src/shared/models/NotificationMessage.ts"
Task: "IPCMessage protocol types in ui/src/shared/models/IPCMessage.ts"
Task: "KeyboardShortcut model in ui/src/shared/models/KeyboardShortcut.ts"
```

### React Components (can run simultaneously)
```  
Task: "MainWindow component in ui/src/renderer/components/MainWindow.tsx"
Task: "MenuBar component in ui/src/renderer/components/MenuBar.tsx"
Task: "ControlPanel component in ui/src/renderer/components/ControlPanel.tsx"
Task: "AnimationViewport component in ui/src/renderer/components/AnimationViewport.tsx"
Task: "StatusBar component in ui/src/renderer/components/StatusBar.tsx"
```

## Notes

### Development Approach
- **TDD**: All contract and integration tests written first (T009-T020)
- **Type Safety**: Full TypeScript coverage з strict mode
- **Parallel Development**: Different files can be developed simultaneously  
- **Integration Points**: Clear contracts between main/renderer processes

### Testing Strategy
- **Contract Tests**: Verify service interface compliance
- **Integration Tests**: Test cross-component workflows
- **E2E Tests**: Full user scenario validation
- **Unit Tests**: Component-specific behavior verification

### Python Engine Integration
- Communication through IPC channels (stdin/stdout JSON protocol)
- Python engine remains independent (from 001- branch)
- Error isolation: UI crashes don't affect engine, vice versa
- Async communication prevents UI blocking

### Cross-Platform Considerations
- Electron handles OS-specific behaviors
- File dialogs use native OS implementations
- Code signing required for macOS/Windows distribution
- Linux packaging через AppImage/deb/rpm

All tasks are immediately executable з sufficient context for LLM completion. Each task includes specific file paths та clear deliverables based on the comprehensive design artifacts.
