# Alex Security Research Academy
### Interactive Bug Bounty Engineering & Security Research Platform (`Bug Bounty Engineering — Researcher Edition 2026`)

An interactive, hypothesis-driven security research workstation and learning platform designed around the 10-stage security research cycle:
`STUDY → MODEL → BASELINE → HYPOTHESIS → CONTROLLED MUTATION → VALIDATION → IMPACT → CHAIN → REPORT → NEW HYPOTHESIS`

---

## 1. Setup, Run, Test & Production Build

```bash
# Install dependencies
npm install

# Start development server on http://localhost:3000
npm run dev

# Run deterministic unit tests (prerequisite graph, SM-2 scheduler, evidence gate, lab evaluator, chain & report validators)
npx --yes tsx --test src/utils/researchEngine.test.ts

# Type-check codebase
npm run lint

# Build production bundle
npm run build
```

---

## 2. Architecture & Domain Separation

- **`src/types/domain.ts`**: Strongly typed models for the 26 curriculum modules, structured lessons, interactive protocol diagrams, synthetic labs, progressive case studies, SM-2 flashcards, research notebook investigations, API inventory matrices, exploit chains, and vulnerability reports.
- **`src/utils/researchEngine.ts` & `src/utils/researchEngine.test.ts`**: Pure, unit-tested business logic for prerequisite graph unlocking, SM-2 spaced-repetition scheduling (separating independent recall from hinted recall), hypothesis evidence-gate validation, deterministic lab evaluation, exploit-chain causal integrity validation, triage report proof-obligation scoring, and JSON/CSV schema validation.
- **`src/data/curriculumData.ts`**: Complete 26-module curriculum catalog mapped to **Bug Bounty Engineering — Researcher Edition 2026**, preserving both printed page numbers (`pp. X–Y`) and PDF viewer positions (`PDF pp. X+8`), plus structured lessons and retrieval-practice flashcards.
- **`src/data/labsAndCasesData.ts`**: Deterministic local HTTP/protocol lab fixtures (including a Mystery Lab), progressive commit-before-reveal case studies (including an explicit False-Positive Case Study), and seed records.
- **`src/context/AcademyContext.tsx`**: Local-first persistence engine with schema versioning, corruption recovery, and JSON export/import.

---

## 3. Source-Content Inventory & Verification Status

Because the workspace initialized without a bundled PDF binary file, the platform explicitly distinguishes:
1. **`verified-curriculum-structure`**: All 26 module titles, chapter mappings (`Ch. 1` through `Ch. 26`), prerequisite relationships, and cross-reference links verified against the specification.
2. **`reconstructed-reference-unit`**: Technical explanations, worked HTTP/code examples, protocol boundary diagrams, and progressive case studies authored as deterministic teaching units mapped to each module.
3. **`original-interactive-lab`**: Safe, offline-executable synthetic HTTP/GraphQL/OIDC/AI-Agent lab fixtures.

---

## 4. Feature Matrix

| Subsystem | Status | Implementation Location |
| :--- | :--- | :--- |
| Command-Centre Dashboard | Implemented & Verified | `src/components/DashboardView.tsx` |
| 26-Module Curriculum & Prerequisite Graph | Implemented & Verified | `src/components/CurriculumView.tsx` |
| Interactive Lesson Workspace & Annotations | Implemented & Verified | `src/components/LessonWorkspace.tsx` |
| Interactive Labs & HTTP Protocol Explorer | Implemented & Verified | `src/components/LabsAndHttpView.tsx` |
| Progressive Case Studies (incl. False-Positive Case) | Implemented & Verified | `src/components/CaseStudiesAndNotebookView.tsx` |
| Evidence-Gated Research Notebook | Implemented & Verified | `src/components/CaseStudiesAndNotebookView.tsx` |
| API Security Workbench & CSV Validator | Implemented & Verified | `src/components/WorkbenchesView.tsx` |
| Auth, State-Machine & TOCTOU Simulator | Implemented & Verified | `src/components/WorkbenchesView.tsx` |
| JS Client-Side Source-to-Sink Trace Lab | Implemented & Verified | `src/components/WorkbenchesView.tsx` |
| Cloud IAM, Android Manifest & CI/CD Lab | Implemented & Verified | `src/components/WorkbenchesView.tsx` |
| AI, LLM, RAG & Agent Security Trace Lab | Implemented & Verified | `src/components/WorkbenchesView.tsx` |
| SM-2 Spaced Repetition & Socratic Mentor | Implemented & Verified | `src/components/ReviewAndMasteryView.tsx` |
| Exploit-Chain Builder & Report Studio | Implemented & Verified | `src/components/ReportingAndChainsView.tsx` |
| Global Search (`⌘K`) & JSON Import/Export | Implemented & Verified | `src/components/SearchAndDataView.tsx` |
