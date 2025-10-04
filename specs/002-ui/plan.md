
# Implementation Plan: Користувацький інтерфейс для системи анімації частинок

**Branch**: `002-ui` | **Date**: 2025-09-27 | **Spec**: `/home/den/git/point-shoting/specs/002-ui/spec.md`
**Input**: Feature specification from `/home/den/git/point-shoting/specs/002-ui/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 9. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## **🎯 IMPLEMENTATION STATUS (Updated: 2025-09-27)**

### **✅ COMPLETED PHASES:**
- **Phase 0**: Research & Requirements → `research.md` ✅ (Electron + TypeScript + React stack)
- **Phase 1**: Design & Architecture → `contracts/`, `data-model.md`, `quickstart.md` ✅  
  - 4 contracts: MainWindow, Settings, Engine Bridge, File Manager ✅
  - Comprehensive data model з UI entities ✅
  - Development quickstart з working examples ✅

### **📋 PHASE 2 PLANNING APPROACH:**
Готовий до генерації задач на базі:
- **Setup tasks**: Electron project init, TypeScript config, build pipeline
- **Contract tests [P]**: 4 contract tests (MainWindow, Settings, Engine, Files) 
- **Core components [P]**: React components на базі data model entities
- **Integration tasks**: IPC communication, Python engine bridge, file operations
- **Polish tasks [P]**: E2E tests, cross-platform builds, performance optimization

Task generation буде базуватися на:
- TypeScript/React ecosystem (jest, playwright, electron-builder)
- 4 contract files → 4 contract test tasks marked [P]
- UI components з data-model.md → parallel implementation tasks
- IPC integration з Python engine → sequential integration tasks
- Cross-platform desktop app workflow

**🔧 STATUS:** Architecture definitive, tech stack confirmed, готовий до task planning

## Summary
Розробка інтуїтивного користувацького інтерфейсу для існуючої системи анімації частинок з використанням Electron (технологія VS Code). Інтерфейс надає повний контроль над параметрами анімації, завантаженням зображень, керуванням відтворенням з міттєвим візуальним зворотним зв'язком. Підхід: Electron + TypeScript для cross-platform сумісності, інтеграція з Python engine через IPC/child_process, React для UI компонентів, Node.js для файлових операцій.

## Technical Context  
**Language/Version**: TypeScript 5.0+, Node.js 18+ (Electron main), React 18+ (renderer)  
**Primary Dependencies**: Electron 27+, React, electron-builder, TypeScript, Vite (bundling), IPC channels до Python engine  
**Storage**: Electron Store (налаштування користувача), файлова система (зображення, конфігурації), Python engine persistence  
**Testing**: Jest + Testing Library (компоненти), Playwright (E2E), spectron (Electron integration)  
**Target Platform**: Windows 10+, macOS 10.15+, Ubuntu 20.04+ (cross-platform desktop)  
**Project Type**: desktop (Electron app з Python backend integration)  
**Performance Goals**: UI відгук ≤100ms, запуск ≤3s, пам'ять UI ≤150MB (додатково до Python engine)  
**Constraints**: Offline-capable, файловий доступ (зображення), Python child process communication, code signing  
**Scale/Scope**: Single-user desktop app, ~20 UI компонентів, 5-10 вікон/діалогів, інтеграція з 9 services з 001- engine

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle 1 (Cross-Platform)**: Electron забезпечує Windows/macOS/Linux сумісність — ✅ PASS  
**Principle 2 (Accessibility/I18n)**: React з i18n (українська/англійська), keyboard navigation, screen-reader support — ✅ PLAN  
**Principle 3 (Privacy/Security)**: Локальні файли, no telemetry за замовчуванням, Python engine local communication — ✅ PASS  
**Principle 4 (Test-First)**: Jest/Testing Library для компонентів, Playwright E2E, integration tests — ✅ PLAN  
**Principle 5 (Observability)**: Electron logging, error reporting (opt-in), crash telemetry з дозволу — ✅ PLAN  
**Principle 6 (Performance)**: Цілі UI 100ms/3s startup/150MB визначені, Electron bundling optimization — ✅ PASS

**Initial Constitution Check**: PASS - All principles addressed. A11y, i18n та observability деталі планується у Phase 1.

**Update Progress Tracking**: Initial Constitution Check ✅

## Progress Tracking

### Phase Completion Status
- ✅ **Phase 0 (Research)**: Electron stack analysis, Python integration strategy, tech decisions documented
- ✅ **Phase 1 (Design)**: 4 contracts defined, data model complete, quickstart готовий
- 🔄 **Phase 2 (Tasks)**: Ready for /tasks command execution  
- ⏸️ **Phase 3 (Implementation)**: Pending task generation
- ⏸️ **Phase 4 (Polish)**: Pending implementation completion

**Post-Design Constitution Check**: ✅ PASS - All principles maintained through design phase

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
