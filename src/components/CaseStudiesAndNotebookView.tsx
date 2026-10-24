import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { CASE_STUDIES } from '../data/labsAndCasesData';
import { CURRICULUM_MODULES } from '../data/curriculumData';
import { HypothesisVerdict, NotebookInvestigation } from '../types/domain';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  FileText,
  Lock,
  NotebookPen,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  ChevronRight,
} from 'lucide-react';

const NOTEBOOK_TEMPLATES: NotebookInvestigation['templateType'][] = [
  'General Investigation',
  'API Authorization Matrix',
  'Session Transition Table',
  'State-Machine Diagram',
  'Source-to-Sink Analysis',
  'Cloud Trust Boundaries',
  'AI-Agent Permission Analysis',
  'False-Positive Investigation',
];

const VERDICT_OPTIONS: HypothesisVerdict[] = [
  'Unverified',
  'Confirmed',
  'Rejected',
  'Inconclusive',
  'Needs More Evidence',
];

export const CaseStudiesView: React.FC = () => {
  const {
    state,
    navigate,
    commitCaseStudyStepHypothesis,
    saveCaseStudyConclusion,
    resetCaseStudyAttempt,
  } = useAcademy();

  const currentCase =
    CASE_STUDIES.find((c) => c.id === state.activeCaseStudyId) || CASE_STUDIES[0];
  const progress = state.caseStudyAttempts[currentCase.id] || {
    caseStudyId: currentCase.id,
    unlockedStepIndex: 0,
    completed: false,
    committedHypotheses: {},
    finalConclusionText: '',
    reasoningScore: 0,
    updatedAt: '',
  };

  const [conclusionDraft, setConclusionDraft] = useState(
    progress.finalConclusionText || ''
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleSelectCase = (caseStudyId: string) => {
    const saved = state.caseStudyAttempts[caseStudyId];
    setConclusionDraft(saved?.finalConclusionText || '');
    setSavedNotice(null);
    navigate('cases', { caseStudyId });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200 mb-2">
              Progressive Case Study Investigations · Commit Hypothesis Before Evidence Reveal
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Case Study Investigation System
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Commit to a testable hypothesis at each stage to unlock the next evidence packet. Defensible alternative hypotheses earn reasoning credit even when they are not the primary root cause.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetCaseStudyAttempt(currentCase.id);
              setConclusionDraft('');
            }}
            className="px-3 py-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap font-medium shadow-xs shrink-0 min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Replay Case Study</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {CASE_STUDIES.map((cs) => {
            const isSelected = cs.id === currentCase.id;
            const csProg = state.caseStudyAttempts[cs.id];
            return (
              <button
                key={cs.id}
                type="button"
                onClick={() => handleSelectCase(cs.id)}
                className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span
                      className={`font-semibold ${
                        isSelected
                          ? 'text-sky-300'
                          : cs.isFalsePositiveCase
                          ? 'text-amber-700'
                          : 'text-sky-700'
                      }`}
                    >
                      {cs.isFalsePositiveCase
                        ? 'FALSE-POSITIVE CASE'
                        : cs.difficulty.toUpperCase()}
                    </span>
                    {csProg?.completed && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`} />
                    )}
                  </div>
                  <div className="text-xs font-semibold mt-1.5 line-clamp-2 leading-snug">
                    {cs.title}
                  </div>
                </div>
                <div className={`text-[11px] mt-2 font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {cs.sourceReference.sectionCode} · {cs.sourceReference.printedPage}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Initial Architecture & Symptom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1.5">
          <div className="font-mono font-semibold text-sky-800 text-[11px]">Scenario Context</div>
          <p className="text-slate-700 leading-relaxed">
            {currentCase.fictionalScenarioSummary}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1.5">
          <div className="font-mono font-semibold text-amber-800 text-[11px]">
            Architecture & Trust Boundaries
          </div>
          <p className="text-slate-700 leading-relaxed">
            {currentCase.architectureAndTrustBoundaries}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-1.5">
          <div className="font-mono font-semibold text-emerald-800 text-[11px]">Initial Symptom Observed</div>
          <p className="text-slate-700 leading-relaxed">
            {currentCase.initialSymptom}
          </p>
        </div>
      </div>

      {/* Progressive Evidence Packets */}
      <div className="space-y-4">
        {currentCase.packets.map((packet) => {
          const isUnlocked = packet.stepIndex <= progress.unlockedStepIndex;
          const committedChoiceId = progress.committedHypotheses[packet.stepIndex];
          const committedChoice = packet.hypothesisChoices.find(
            (c) => c.id === committedChoiceId
          );

          if (!isUnlocked) {
            return (
              <div
                key={packet.stepIndex}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs text-slate-500"
              >
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Locked Evidence Packet: <strong>{packet.stageTitle}</strong> — Commit to a hypothesis in Stage {packet.stepIndex} first.
                  </span>
                </div>
              </div>
            );
          }

          return (
            <section
              key={packet.stepIndex}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono font-semibold text-sky-800">{packet.stageTitle}</span>
                {committedChoice && (
                  <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Hypothesis Committed ({committedChoice.creditLevel.toUpperCase()})
                  </span>
                )}
              </div>

              <h2 className="text-base font-bold text-slate-900">
                {packet.observationTitle}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">{packet.artifactText}</p>

              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto leading-relaxed">
                {packet.codeOrTraffic}
              </pre>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-900">
                  {packet.hypothesisPrompt}
                </div>
                {packet.hypothesisChoices.map((choice) => {
                  const isPicked = committedChoiceId === choice.id;
                  return (
                    <div
                      key={choice.id}
                      className={`p-3.5 rounded-lg border text-xs transition-all ${
                        isPicked
                          ? 'border-sky-300 bg-sky-50/70 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <span className="leading-relaxed font-medium">{choice.hypothesisText}</span>
                        <button
                          type="button"
                          onClick={() =>
                            commitCaseStudyStepHypothesis(
                              currentCase.id,
                              packet.stepIndex,
                              choice.id,
                              choice.creditLevel,
                              currentCase.packets.length
                            )
                          }
                          className={`px-3 py-1.5 font-semibold rounded-md text-xs whitespace-nowrap shrink-0 transition-colors ${
                            isPicked
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                          }`}
                        >
                          {isPicked ? 'Committed' : 'Commit Hypothesis'}
                        </button>
                      </div>
                      {isPicked && (
                        <div className="mt-2.5 pt-2.5 border-t border-sky-200/80 text-emerald-800 font-medium">
                          {choice.reasoningFeedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Expert Walkthrough & Final Conclusion (Revealed once all packets unlocked) */}
      {progress.unlockedStepIndex >= currentCase.packets.length && (
        <section className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-6 shadow-xs space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-900 mb-1">
              All Evidence Packets Unlocked · Expert Post-Mortem Walkthrough
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Distinguishing the Exposing Clue from the Establishing Proof
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="font-bold text-amber-800">
                1. The Clue That Exposed the Issue
              </div>
              <p className="text-slate-700 leading-relaxed">
                {currentCase.expertWalkthrough.exposingClue}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="font-bold text-emerald-800">
                2. The Proof That Established It
              </div>
              <p className="text-slate-700 leading-relaxed">
                {currentCase.expertWalkthrough.establishingProof}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="font-bold text-sky-800">3. Root Cause</div>
              <p className="text-slate-700 leading-relaxed">
                {currentCase.expertWalkthrough.rootCause}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-xs space-y-1">
              <div className="font-bold text-indigo-800">
                4. Demonstrated Impact & Limitations
              </div>
              <p className="text-slate-700 leading-relaxed">
                {currentCase.expertWalkthrough.securityImpact} — Limitations:{' '}
                {currentCase.expertWalkthrough.limitations}
              </p>
            </div>
          </div>

          {/* Learner Final Conclusion Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCaseStudyConclusion(currentCase.id, conclusionDraft);
              setSavedNotice('Final evidence-based conclusion saved to your profile.');
            }}
            className="space-y-3 pt-3 border-t border-emerald-200 text-xs"
          >
            <label
              htmlFor="case-final-conclusion"
              className="block font-bold text-slate-900"
            >
              Record Your Evidence-Based Case Conclusion:
            </label>
            <textarea
              id="case-final-conclusion"
              rows={3}
              value={conclusionDraft}
              onChange={(e) => setConclusionDraft(e.target.value)}
              placeholder="Summarize the violated invariant, the controlled test, and why alternative explanations were ruled out..."
              className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-xs"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs min-h-[38px]"
              >
                Save Case Conclusion
              </button>
              {savedNotice && (
                <span className="text-emerald-800 font-medium">{savedNotice}</span>
              )}
            </div>
          </form>
        </section>
      )}
    </div>
  );
};

export const NotebookView: React.FC = () => {
  const {
    state,
    createInvestigation,
    updateInvestigationVerdict,
    addEvidenceToInvestigation,
    addExperimentToInvestigation,
    deleteInvestigation,
  } = useAcademy();

  const [selectedInvId, setSelectedInvId] = useState<string>(
    state.notebookInvestigations[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFeedback, setVerdictFeedback] = useState<{
    type: 'error' | 'warning' | 'success';
    text: string;
  } | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // New investigation form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState<NotebookInvestigation['templateType']>(
    'API Authorization Matrix'
  );
  const [newModuleId, setNewModuleId] = useState('mod-06');
  const [newObservation, setNewObservation] = useState('');
  const [newHypothesis, setNewHypothesis] = useState('');
  const [newInvariant, setNewInvariant] = useState('');

  // New Evidence Form
  const [evTitle, setEvTitle] = useState('');
  const [evSnapshot, setEvSnapshot] = useState('');
  const [evInvariantState, setEvInvariantState] = useState('');

  // New Experiment Form
  const [expDesc, setExpDesc] = useState('');
  const [expVar, setExpVar] = useState('');
  const [expExpected, setExpExpected] = useState('');
  const [expActual, setExpActual] = useState('');
  const [expVerdict, setExpVerdict] = useState<HypothesisVerdict>('Confirmed');

  const filteredInvestigations = state.notebookInvestigations.filter((inv) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      inv.title.toLowerCase().includes(q) ||
      inv.hypothesisStatement.toLowerCase().includes(q) ||
      inv.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const activeInv =
    state.notebookInvestigations.find((i) => i.id === selectedInvId) ||
    filteredInvestigations[0];

  const handleCreateInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newHypothesis.trim()) return;
    const id = createInvestigation({
      title: newTitle.trim(),
      moduleId: newModuleId,
      templateType: newTemplate,
      tags: [newTemplate.split(' ')[0], newModuleId.toUpperCase()],
      observation: newObservation.trim() || 'Initial baseline observation recorded.',
      hypothesisStatement: newHypothesis.trim(),
      invariantTested: newInvariant.trim() || 'Boundary enforcement check',
      verdict: 'Unverified',
      experiments: [],
      evidenceRecords: [],
      counterEvidenceNotes: '',
      rootCauseConclusion: '',
      markdownNotes: `### Template: ${newTemplate}\nInitialized structured investigation.`,
    });
    setSelectedInvId(id);
    setShowNewForm(false);
    setNewTitle('');
    setNewObservation('');
    setNewHypothesis('');
    setNewInvariant('');
  };

  const handleVerdictChange = (targetVerdict: HypothesisVerdict) => {
    if (!activeInv) return;
    const res = updateInvestigationVerdict(
      activeInv.id,
      targetVerdict,
      exceptionReason
    );
    if (!res.allowed) {
      setVerdictFeedback({ type: 'error', text: res.error || 'Blocked.' });
    } else if (res.warning) {
      setVerdictFeedback({ type: 'warning', text: res.warning });
    } else {
      setVerdictFeedback({
        type: 'success',
        text: `Hypothesis verdict updated to ${targetVerdict}.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200 mb-2">
            Local-First Security Research Notebook · Evidence-Gated Registry
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Research Notebook & Hypothesis Registry
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            A hypothesis cannot be marked Confirmed without at least one attached Evidence Record or validated Experiment (unless an explicit exception rationale is logged).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 whitespace-nowrap shadow-xs min-h-[40px] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Investigation</span>
        </button>
      </div>

      {/* Create New Investigation Drawer */}
      {showNewForm && (
        <form
          onSubmit={handleCreateInvestigation}
          className="bg-white border-2 border-slate-900 rounded-xl p-5 shadow-sm space-y-4 text-xs"
        >
          <div className="font-bold text-sm text-slate-900">
            Create New Structured Investigation Record
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="new-inv-title" className="block text-slate-700 font-semibold mb-1">
                Investigation Title
              </label>
              <input
                id="new-inv-title"
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., OAuth Callback State Validation on /connect"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label htmlFor="new-inv-template" className="block text-slate-700 font-semibold mb-1">
                Research Template
              </label>
              <select
                id="new-inv-template"
                value={newTemplate}
                onChange={(e) =>
                  setNewTemplate(
                    e.target.value as NotebookInvestigation['templateType']
                  )
                }
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {NOTEBOOK_TEMPLATES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-inv-mod" className="block text-slate-700 font-semibold mb-1">
                Curriculum Module
              </label>
              <select
                id="new-inv-mod"
                value={newModuleId}
                onChange={(e) => setNewModuleId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                {CURRICULUM_MODULES.map((m) => (
                  <option key={m.id} value={m.id}>
                    M{String(m.number).padStart(2, '0')} — {m.shortTitle}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-inv-obs" className="block text-slate-700 font-semibold mb-1">
                Baseline Observation
              </label>
              <textarea
                id="new-inv-obs"
                rows={2}
                value={newObservation}
                onChange={(e) => setNewObservation(e.target.value)}
                placeholder="What baseline HTTP or runtime behavior did you observe?"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label htmlFor="new-inv-hyp" className="block text-slate-700 font-semibold mb-1">
                Testable Hypothesis Statement (Required, 10+ chars)
              </label>
              <textarea
                id="new-inv-hyp"
                rows={2}
                required
                value={newHypothesis}
                onChange={(e) => setNewHypothesis(e.target.value)}
                placeholder="If [invariant] is missing, then mutating [variable] will produce [evidence]..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs shadow-xs min-h-[38px]"
            >
              Initialize Investigation
            </button>
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Split Notebook Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 cols: Searchable Investigation List */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search notebook investigations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hypotheses, tags, or notes..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-2">
            {filteredInvestigations.map((inv) => {
              const isSelected = activeInv?.id === inv.id;
              return (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => {
                    setSelectedInvId(inv.id);
                    setVerdictFeedback(null);
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isSelected ? 'text-sky-300 font-semibold' : 'text-sky-700 font-semibold'}>
                      {inv.templateType}
                    </span>
                    <span
                      className={`font-semibold ${
                        isSelected
                          ? 'text-slate-200'
                          : inv.verdict === 'Confirmed'
                          ? 'text-emerald-700'
                          : inv.verdict === 'Rejected'
                          ? 'text-amber-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {inv.verdict.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-semibold mt-1 leading-snug">{inv.title}</div>
                  <div className={`text-[11px] mt-1 font-mono ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {inv.evidenceRecords.length} Evidence · {inv.experiments.length}{' '}
                    Experiments
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 cols: Active Investigation Detail & Evidence Gate */}
        {activeInv ? (
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="text-xs font-mono text-sky-800 font-semibold">
                  {activeInv.templateType} · Module {activeInv.moduleId.toUpperCase()} · Updated {activeInv.updatedAt}
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  {activeInv.title}
                </h2>
                <div className="text-xs text-slate-500 mt-1">
                  Tags: {activeInv.tags.join(' · ')}
                </div>
              </div>

              <div>
                {confirmDeleteId === activeInv.id ? (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        deleteInvestigation(activeInv.id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-md font-semibold text-xs"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(activeInv.id)}
                    className="px-2.5 py-1.5 text-xs bg-white hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-700 rounded-md flex items-center gap-1 font-medium transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Observation & Hypothesis Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-700">
                  Recorded Observation
                </div>
                <p className="text-slate-800 leading-relaxed">
                  {activeInv.observation}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-sky-50/50 border border-sky-200 space-y-1">
                <div className="font-semibold text-sky-900">
                  Testable Hypothesis Statement
                </div>
                <p className="text-slate-900 font-medium leading-relaxed">
                  {activeInv.hypothesisStatement}
                </p>
              </div>
            </div>

            {/* Evidence-Gated Verdict Controls */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-700" />
                  <span>
                    Current Verdict: <strong className="text-sky-800">{activeInv.verdict}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {VERDICT_OPTIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleVerdictChange(v)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        activeInv.verdict === v
                          ? 'bg-slate-900 text-white shadow-xs font-semibold'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                <label
                  htmlFor="exception-rationale-input"
                  className="text-slate-600 text-xs shrink-0"
                >
                  Code Audit Exception Rationale:
                </label>
                <input
                  id="exception-rationale-input"
                  type="text"
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  placeholder="Enter 15+ char justification if no live packet attached..."
                  className="flex-1 px-3 py-1 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {verdictFeedback && (
                <div
                  role="alert"
                  className={`p-3 rounded-lg border flex items-center gap-2 text-xs ${
                    verdictFeedback.type === 'error'
                      ? 'border-rose-300 bg-rose-50 text-rose-800'
                      : verdictFeedback.type === 'warning'
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{verdictFeedback.text}</span>
                </div>
              )}
            </div>

            {/* Attached Evidence Records & Add Evidence Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Supporting Evidence Records ({activeInv.evidenceRecords.length})
                </h3>
                {activeInv.evidenceRecords.length === 0 ? (
                  <p className="text-slate-500 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    No evidence attached yet. Attach an HTTP differential below or from the Interactive Lab before marking Confirmed.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activeInv.evidenceRecords.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                      >
                        <div className="font-mono text-emerald-700 font-semibold">
                          {ev.id} · {ev.title}
                        </div>
                        <pre className="p-2 rounded bg-slate-950 font-mono text-[11px] text-slate-100 overflow-x-auto">
                          {ev.requestResponseSnapshot}
                        </pre>
                        <div className="text-slate-600">
                          State: {ev.observedInvariantState}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!evTitle.trim() || !evSnapshot.trim()) return;
                    addEvidenceToInvestigation(
                      activeInv.id,
                      evTitle,
                      evSnapshot,
                      evInvariantState || 'Boundary violation verified'
                    );
                    setEvTitle('');
                    setEvSnapshot('');
                    setEvInvariantState('');
                  }}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="font-bold text-slate-900">
                    Attach New Evidence Artifact
                  </div>
                  <input
                    type="text"
                    required
                    value={evTitle}
                    onChange={(e) => setEvTitle(e.target.value)}
                    placeholder="Evidence title (e.g., v1 200 OK cross-tenant response)"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <textarea
                    rows={2}
                    required
                    value={evSnapshot}
                    onChange={(e) => setEvSnapshot(e.target.value)}
                    placeholder="Paste sanitized request/response pair..."
                    className="w-full p-2 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md text-xs shadow-xs min-h-[36px]"
                  >
                    Attach Evidence Record
                  </button>
                </form>
              </div>

              {/* Controlled Experiments Log */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Controlled Experiments ({activeInv.experiments.length})
                </h3>
                {activeInv.experiments.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-sky-800 font-semibold">
                        Var: {exp.independentVariable}
                      </span>
                      <span className="text-emerald-700 font-semibold">{exp.verdict}</span>
                    </div>
                    <div className="font-medium text-slate-900">
                      {exp.description}
                    </div>
                    <div className="text-slate-600">
                      Actual: {exp.actualResult}
                    </div>
                  </div>
                ))}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!expDesc.trim() || !expActual.trim()) return;
                    addExperimentToInvestigation(activeInv.id, {
                      description: expDesc,
                      independentVariable: expVar || 'Single Parameter',
                      expectedResult: expExpected || '403 Forbidden',
                      actualResult: expActual,
                      verdict: expVerdict,
                      rationale: 'Controlled differential check',
                    });
                    setExpDesc('');
                    setExpVar('');
                    setExpExpected('');
                    setExpActual('');
                  }}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="font-bold text-slate-900">
                    Log Controlled Experiment
                  </div>
                  <input
                    type="text"
                    required
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="Experiment description..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <input
                    type="text"
                    value={expVar}
                    onChange={(e) => setExpVar(e.target.value)}
                    placeholder="Independent variable mutated..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <input
                    type="text"
                    required
                    value={expActual}
                    onChange={(e) => setExpActual(e.target.value)}
                    placeholder="Observed actual result..."
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md text-xs shadow-xs min-h-[36px]"
                  >
                    Record Experiment
                  </button>
                </form>
              </div>
            </div>

            {/* Change History Audit Log */}
            <div className="pt-3 border-t border-slate-200 text-xs">
              <div className="font-mono text-slate-500 font-semibold mb-1.5">
                Investigation Audit Trail (Preserves Negative & Rejected Hypotheses):
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-600">
                {activeInv.changeHistory.map((ch, idx) => (
                  <div key={idx}>
                    [{ch.timestamp}] {ch.summary}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
