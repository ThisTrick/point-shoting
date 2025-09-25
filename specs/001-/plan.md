
# Implementation Plan: Particle Burst → Image Formation Feature

**Branch**: `001-` | **Date**: 2025-09-25 | **Spec**: `/home/den/git/point-shoting/specs/001-/spec.md`
**Input**: Feature specification from `/specs/001-/spec.md`

## **🎯 IMPLEMENTATION STATUS (Updated: 2025-09-25)**

### **✅ COMPLETED PHASES:**
- **Phase 0**: Research & Requirements → `research.md` ✅
- **Phase 1**: Design & Architecture → `contracts/`, `data-model.md`, `quickstart.md` ✅  
- **Phase 2**: Task Planning → `tasks.md` (100 structured tasks) ✅
- **Phase 3.1-3.6**: Core Implementation ✅
  - Project setup with uv package management ✅
  - All 9 contract tests created (TDD approach) ✅
  - Core models: Stage, Settings, ParticleArrays, Metrics ✅
  - All 7 services implemented: ColorMapper, BreathingOscillator, HUDRenderer, etc. ✅
  - ParticleEngine with full simulation framework ✅
  - CLI orchestration layer with ControlInterface ✅

### **🔄 IN PROGRESS:** 
- **Phase 3.7**: Contract test activation (17 passed, 51 skipped)
  - ColorMapper: 6/6 tests ✅ (100% complete)
  - BreathingOscillator: 4/7 tests ✅ (57% complete)

### **📈 PROGRESS:** 50/100 tasks completed (50% overall completion)
### **🔧 STATUS:** Fully functional core system, ready for CLI usage and remaining test activation

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

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Анімація перетворення: від центральних «пострілів» рою частинок через хаос до впізнаваної форми вихідного зображення ≤10 с з підтримкою режимів кольору (стильний/точний), зациклення, керування етапами та продуктивністю (ціль 60 FPS) на CPU без GPU-прискорення. Підхід: Python 3.11, NumPy для векторизованих оновлень положень, адаптивний крок часу (dt) при перевантаженні, окремий шар політики переходів. Візуалізаційний шар зараз мінімальний (CLI / ASCII / offscreen buffer) — що відділяє логіку від графічного бекенду. Це ПРОМІЖНИЙ headless/CLI прототип для швидкої ітерації; окрема GUI (кросплатформна оболонка — Tauri/Electron аналіз) буде визначена в roadmap документі (див. tasks T098) і не суперечить принципу кросплатформності.

## Technical Context
**Language/Version**: Python 3.11 (CPython)  
**Primary Dependencies**: NumPy (обчислення масивів), Pillow (завантаження/семплінг зображення), Rich (опціонально HUD/лог), dataclasses, pytest.  
**Storage**: In-memory (опціонально кеш координат у JSON).  
**Testing**: pytest (unit/integration), hypothesis (опціонально для property-based інваріантів).  
**Dependency / Packaging Tool**: uv (швидке керування залежностями та lock; використовується замість стандартного pip + venv для відтворюваності).
**Target Platform**: Linux/macOS/Windows (CLI прототип).  
**Project Type**: single (Option 1).  
**Performance Goals**: 60 FPS target; ≥55 середньо при ~8–10k частинок (середній профіль).  
**Constraints**: CPU-only, без GPU/OpenGL; старт ≤2 c; Pause/Play latency ≤200 ms; пам'ять <300MB @10k частинок; lock-файл залежностей формується через `uv lock`.
**Observability**: структуроване логування JSON + опціональний crash handler (каркас у задачі T065).  
**Accessibility Roadmap**: кінцева графічна оболонка отримає keyboard navigation & i18n (backlog doc tasks T097, T098).  
**Scale/Scope**: Particle counts: low≈3k / medium≈9k / high≈15k.  

Pending Research (Phase 0):
 - Допустиме просідання FPS при HUD (порог %)
 - Політика розчинення частинок (чи увімкнено)
 - Runtime resize: авто чи між циклами
 - Persistence (зберігати останні налаштування?)
 - Мін. розмір/формат водяного знака
 - Чи показувати метрики кінцевому користувачу або лише в Debug HUD

## Constitution Check
Principle 1 (Cross-Platform): Python + portable libs — OK.
Principle 2 (Accessibility/I18n): i18n файли ресурсів (yaml/json) плануються; A11y для CLI низький пріоритет — вказано як майбутній UI шар.
Principle 3 (Privacy/Security): Немає зовнішніх мережевих викликів; телеметрія disabled by default.
Principle 4 (Test-First): Контракти + інваріантні тести до реалізації — plan conforms.
Principle 5 (Observability): Логування структуроване (logger + DEBUG HUD канал) — додати у Phase 1.
Principle 6 (Performance): Цілі FPS, пам'ять і старт визначені.

Initial Constitution Check: No blocking violations. A11y deferred (documented). Observability detail pending (Phase 1). 
Updated Constitution Note: A11y та GUI винесені у roadmap (T097/T098). Observability каркас планується у Phase 3.8 (T065).

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

**Structure Decision**: Option 1 (single project) — достатньо для ядра анімації.

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

**Output**: research.md (включає рішення по HUD FPS, dissolve, resize strategy, persistence, watermark spec, metrics visibility)

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate Module Contracts** (не HTTP):
   - ControlInterface (start, pause, resume, skip_final, restart, apply_settings)
   - ParticleEngine (init(image), step(dt), stage(), metrics())
   - ColorMapper (stylized_palette(image), precise_color(px))
   - StageTransitionPolicy (evaluate(state_snapshot))
   - BreathingOscillator (apply(positions, t))
   - WatermarkRenderer (compose(frame, config))
   - LocalizationProvider (t(key, locale))
   - SettingsStore (load/save)
   - HUDRenderer (render(metrics, stage, fps))
   Контракти у markdown + Python stubs.

3. **Generate contract tests**:
   - Один файл на контракт (перевірка наявності методів, очікуваних винятків)
   - ParticleEngine: інваріанти (кількість частинок стабільна без dissolve, координати в межах, energy damping монотонний у фазі хаосу)
   - StageTransitionPolicy: переходи за часом + критерій впізнаваності (підроблений метрик адаптер)
   - ColorMapper: точний режим ΔE≤20; стильний — палітра з <=32 кольорами.

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally**:
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
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
