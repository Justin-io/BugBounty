import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  CURRICULUM_MODULES,
  FLASHCARDS_DATA,
  LESSONS_CATALOG,
} from '../data/curriculumData';
import { CASE_STUDIES, INTERACTIVE_LABS } from '../data/labsAndCasesData';
import { validateLearnerImportPackage } from '../utils/researchEngine';
import { indexedDbStorage } from '../utils/indexedDbStorage';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Search,
  Settings,
  Sun,
  Moon,
  Upload,
  X,
  RotateCcw,
} from 'lucide-react';

export const CommandPaletteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { state, navigate } = useAcademy();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const results: {
    id: string;
    category: 'Lesson' | 'Lab' | 'Case Study' | 'Notebook' | 'Flashcard';
    title: string;
    subtitle: string;
    onSelect: () => void;
  }[] = [];

  for (const les of LESSONS_CATALOG) {
    if (typeFilter !== 'ALL' && typeFilter !== 'Lesson') continue;
    if (
      !q ||
      les.title.toLowerCase().includes(q) ||
      les.coreMentalModel.toLowerCase().includes(q) ||
      les.sourceReference.sectionCode.toLowerCase().includes(q)
    ) {
      results.push({
        id: les.id,
        category: 'Lesson',
        title: `M${String(les.moduleNumber).padStart(2, '0')}.${les.orderInModule} — ${les.title}`,
        subtitle: `${les.sourceReference.sectionCode} · ${les.sourceReference.printedPage}`,
        onSelect: () => {
          navigate('lesson', { moduleId: les.moduleId, lessonId: les.id });
          onClose();
        },
      });
    }
  }

  for (const lab of INTERACTIVE_LABS) {
    if (typeFilter !== 'ALL' && typeFilter !== 'Lab') continue;
    if (
      !q ||
      lab.title.toLowerCase().includes(q) ||
      lab.family.toLowerCase().includes(q) ||
      lab.securityInvariant.toLowerCase().includes(q)
    ) {
      results.push({
        id: lab.id,
        category: 'Lab',
        title: lab.title,
        subtitle: `${lab.family} · ${lab.difficulty}`,
        onSelect: () => {
          navigate('labs', { labId: lab.id });
          onClose();
        },
      });
    }
  }

  for (const cs of CASE_STUDIES) {
    if (typeFilter !== 'ALL' && typeFilter !== 'Case Study') continue;
    if (
      !q ||
      cs.title.toLowerCase().includes(q) ||
      cs.domain.toLowerCase().includes(q)
    ) {
      results.push({
        id: cs.id,
        category: 'Case Study',
        title: cs.title,
        subtitle: `${cs.domain} · ${cs.sourceReference.printedPage}`,
        onSelect: () => {
          navigate('cases', { caseStudyId: cs.id });
          onClose();
        },
      });
    }
  }

  for (const inv of state.notebookInvestigations) {
    if (typeFilter !== 'ALL' && typeFilter !== 'Notebook') continue;
    if (
      !q ||
      inv.title.toLowerCase().includes(q) ||
      inv.hypothesisStatement.toLowerCase().includes(q) ||
      inv.tags.some((t) => t.toLowerCase().includes(q))
    ) {
      results.push({
        id: inv.id,
        category: 'Notebook',
        title: inv.title,
        subtitle: `${inv.verdict} · ${inv.tags.join(', ')}`,
        onSelect: () => {
          navigate('notebook');
          onClose();
        },
      });
    }
  }

  for (const fc of FLASHCARDS_DATA) {
    if (typeFilter !== 'ALL' && typeFilter !== 'Flashcard') continue;
    if (
      !q ||
      fc.conceptName.toLowerCase().includes(q) ||
      fc.prompt.toLowerCase().includes(q)
    ) {
      results.push({
        id: fc.id,
        category: 'Flashcard',
        title: fc.conceptName,
        subtitle: fc.prompt.slice(0, 80) + '...',
        onSelect: () => {
          navigate('review');
          onClose();
        },
      });
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search and Command Palette"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-16 px-4"
    >
      <div className="w-full max-w-2xl border border-slate-200 bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-4 h-4 text-sky-700 shrink-0" />
          <input
            type="search"
            autoFocus
            aria-label="Global search query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 26 modules, lessons, HTTP invariants, labs, case studies, or notebook entries..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search modal"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center gap-1.5 text-xs">
          {(['ALL', 'Lesson', 'Lab', 'Case Study', 'Notebook', 'Flashcard'] as const).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all ${
                  typeFilter === t
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            )
          )}
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No matching curriculum items, labs, or notebook investigations found for "{query}".
            </div>
          ) : (
            results.slice(0, 18).map((item) => (
              <button
                key={`${item.category}-${item.id}`}
                type="button"
                onClick={item.onSelect}
                className="w-full p-3.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shrink-0">
                  {item.category.toUpperCase()}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export const DataAndSettingsView: React.FC = () => {
  const {
    state,
    toggleTheme,
    importValidatedState,
    resetAllProgress,
    isIndexedDbReady,
    indexedDbStatus,
    curriculumStructure,
    reloadCurriculumFromIndexedDb,
  } = useAcademy();

  const [includePrivateNotes, setIncludePrivateNotes] = useState(true);
  const [importJsonText, setImportJsonText] = useState('');
  const [validationResult, setValidationResult] = useState<ReturnType<
    typeof validateLearnerImportPackage
  > | null>(null);
  const [importAppliedMsg, setImportAppliedMsg] = useState<string | null>(null);
  const [confirmFactoryReset, setConfirmFactoryReset] = useState(false);
  const [idbActionMsg, setIdbActionMsg] = useState<string | null>(null);

  const getExportJsonString = () => {
    const payload: Partial<typeof state> = {
      ...state,
      notebookInvestigations: includePrivateNotes
        ? state.notebookInvestigations
        : [],
      lessonAnnotations: includePrivateNotes ? state.lessonAnnotations : [],
    };
    return JSON.stringify(payload, null, 2);
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([getExportJsonString()], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alex-security-academy-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreviewValidation = (e: React.FormEvent) => {
    e.preventDefault();
    setImportAppliedMsg(null);
    const res = validateLearnerImportPackage(importJsonText);
    setValidationResult(res);
  };

  const handleApplyValidatedImport = () => {
    if (!validationResult?.valid || !validationResult.parsedState) return;
    importValidatedState(validationResult.parsedState);
    setImportAppliedMsg(
      'Validated state package restored into active local workspace.'
    );
  };

  const handleForceIdbSync = async () => {
    try {
      if (!indexedDbStorage.isSupported()) {
        setIdbActionMsg('IndexedDB not supported in current environment.');
        return;
      }
      await indexedDbStorage.persistCurriculumStructure(curriculumStructure);
      await indexedDbStorage.persistLearnerState(state);
      setIdbActionMsg('All 26 Modules & Learner State synchronized to IndexedDB successfully.');
      setTimeout(() => setIdbActionMsg(null), 4000);
    } catch {
      setIdbActionMsg('Failed to sync to IndexedDB.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-sky-700 font-semibold uppercase tracking-wider">
            IndexedDB Persistence · Schema-Validated Export/Import · Workstation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display tracking-tight">
            Data Persistence & Workspace Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Audit your local-first IndexedDB database, export portable JSON snapshots, and configure visual preferences.
          </p>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-md flex items-center gap-2 shadow-2xs"
        >
          {state.theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Switch to Light Theme</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-sky-700" />
              <span>Switch to Dark Theme</span>
            </>
          )}
        </button>
      </div>

      {/* IndexedDB Database Live Engine Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">
              IndexedDB Storage Engine Status
            </h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold">
            {indexedDbStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Curriculum Modules Persisted</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {curriculumStructure.totalModules} Core Modules
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Version {curriculumStructure.version}</div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Lab Proof Requirements</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {curriculumStructure.totalLabRequirements} Invariants
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Defensible proof obligations</div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-slate-500 font-medium">Object Stores Initialized</div>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              6 Stores Active
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">modules, lessons, state, notebook</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleForceIdbSync}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md shadow-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync Active Workspace to IndexedDB</span>
          </button>
          <button
            type="button"
            onClick={reloadCurriculumFromIndexedDb}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-xs rounded-md shadow-2xs"
          >
            Reload Curriculum from IndexedDB
          </button>
        </div>

        {idbActionMsg && (
          <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            {idbActionMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4 text-xs">
          <h2 className="text-base font-bold text-slate-900">
            1. Export Portable JSON Backup
          </h2>
          <p className="text-slate-600">
            Creates a portable JSON snapshot of completed lessons, validated lab attempts, spaced-repetition schedules, and report drafts.
          </p>

          <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              checked={includePrivateNotes}
              onChange={(e) => setIncludePrivateNotes(e.target.checked)}
              className="text-sky-600"
            />
            <span className="text-slate-800 font-medium">
              Include private Research Notebook entries and inline lesson annotations
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
            <button
              type="button"
              onClick={() => setImportJsonText(getExportJsonString())}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-md shadow-2xs"
            >
              Load Current State into Validator
            </button>
          </div>
        </div>

        {/* Import & Schema Validation Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-slate-900">
              2. Validate & Restore JSON State
            </h2>
            <button
              type="button"
              onClick={() =>
                setImportJsonText('{"schemaVersion": 0, "readingCompletedLessonIds": "not-an-array"}')
              }
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 text-amber-800 rounded-md text-[11px] font-medium"
            >
              Load Malformed Test
            </button>
          </div>

          <form onSubmit={handlePreviewValidation} className="space-y-3">
            <textarea
              rows={5}
              aria-label="JSON state import payload"
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste exported LearnerState JSON here to validate schema before applying..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-md font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Validate Import Schema & Preview</span>
            </button>
          </form>

          {validationResult && (
            <div
              role="status"
              className={`p-3.5 rounded-lg border space-y-2 ${
                validationResult.valid
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-rose-300 bg-rose-50 text-rose-900'
              }`}
            >
              {validationResult.valid && validationResult.summary ? (
                <>
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Schema Validated — Ready to Restore:</span>
                  </div>
                  <div className="font-mono text-[11px]">
                    Lessons Assessed: {validationResult.summary.lessonsCompleted} · Labs Attempted:{' '}
                    {validationResult.summary.labsAttempted} · Notebook Investigations:{' '}
                    {validationResult.summary.investigationsCount} · Reports:{' '}
                    {validationResult.summary.reportsCount}
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyValidatedImport}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md shadow-xs"
                  >
                    Confirm & Apply Import
                  </button>
                </>
              ) : (
                <>
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Import Rejected Safely (Saved State Unchanged):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {importAppliedMsg && (
            <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium">
              {importAppliedMsg}
            </div>
          )}
        </div>
      </div>

      {/* Destructive Reset Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div>
          <div className="font-bold text-slate-900">
            Factory Workspace Reset & Recovery
          </div>
          <p className="text-slate-500 mt-0.5">
            Resets all local progress, lab attempts, and custom notebook records back to clean initial seed data.
          </p>
        </div>
        {confirmFactoryReset ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetAllProgress();
                setConfirmFactoryReset(false);
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md shadow-xs"
            >
              Confirm Permanent Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmFactoryReset(false)}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmFactoryReset(true)}
            className="px-3.5 py-2 border border-rose-300 hover:bg-rose-50 text-rose-700 font-medium rounded-md bg-white shadow-2xs"
          >
            Reset Local Workspace
          </button>
        )}
      </div>
    </div>
  );
};
