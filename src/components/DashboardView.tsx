import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  CURRICULUM_MODULES,
  FLASHCARDS_DATA,
  LESSONS_CATALOG,
} from '../data/curriculumData';
import { INTERACTIVE_LABS } from '../data/labsAndCasesData';
import {
  calculateProgressionMetrics,
  evaluateModuleUnlockStatus,
} from '../utils/researchEngine';
import { SkillDimension } from '../types/domain';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  FlaskConical,
  NotebookPen,
  Plus,
  RotateCcw,
  Target,
  Brain,
  AlertTriangle,
  ShieldAlert,
  Flame,
} from 'lucide-react';

const SKILL_LABELS: Record<SkillDimension, string> = {
  conceptualUnderstanding: 'Conceptual & Protocol Modeling',
  protocolInterpretation: 'HTTP & Wire Framing Analysis',
  experimentalDesign: 'Controlled Experimental Design',
  evidenceQuality: 'Reproducible Evidence Quality',
  authorizationReasoning: 'Multi-Tenant & RBAC Reasoning',
  falsePositiveRejection: 'False-Positive Exclusion',
  rootCauseExplanation: 'Root-Cause Code & Parser Tracing',
  impactAnalysis: 'Capability & Impact Analysis',
  reportQuality: 'Triage-Grade Report Writing',
};

const GOAL_TRACKS = [
  'Full-Spectrum Security Researcher',
  'API & Authorization Specialist',
  'Browser & Client-Side Researcher',
  'Cloud & Supply-Chain Security',
  'Mobile & Android Security',
  'AI, RAG & Agentic Security',
] as const;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DashboardView: React.FC = () => {
  const {
    state,
    navigate,
    setGoalTrack,
    setDailyTargetMinutes,
    quickCaptureObservation,
    resetAllProgress,
    isIndexedDbReady,
    indexedDbStatus,
    curriculumStructure,
  } = useAcademy();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickTag, setQuickTag] = useState<'Observation' | 'Hypothesis' | 'Follow-up'>('Hypothesis');
  const [quickNote, setQuickNote] = useState('');
  const [quickSavedBanner, setQuickSavedBanner] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const metrics = calculateProgressionMetrics(state);
  const activeLesson =
    LESSONS_CATALOG.find((l) => l.id === state.activeLessonId) || LESSONS_CATALOG[0];
  const activeModule =
    curriculumStructure.modules.find((m) => m.id === activeLesson.moduleId) ||
    curriculumStructure.modules[0];

  // Next recommended lesson (first lesson not yet mastered)
  const nextRecommendedLesson =
    LESSONS_CATALOG.find((l) => !state.masteredLessonIds.includes(l.id)) ||
    LESSONS_CATALOG[0];
  const nextRecommendedModule =
    curriculumStructure.modules.find((m) => m.id === nextRecommendedLesson.moduleId) ||
    curriculumStructure.modules[0];
  const nextModuleUnlock = evaluateModuleUnlockStatus(
    nextRecommendedModule,
    curriculumStructure.modules,
    state
  );

  // Due flashcards count
  const now = Date.now();
  const dueFlashcards = FLASHCARDS_DATA.filter((fc) => {
    const rev = state.flashcardReviews[fc.id];
    return !rev || rev.dueTimestamp <= now || rev.flaggedForReview;
  });

  // Unresolved hypotheses in notebook
  const unresolvedInvestigations = state.notebookInvestigations.filter(
    (inv) => inv.verdict === 'Unverified' || inv.verdict === 'Needs More Evidence'
  );

  // Weakest skill dimension for targeted drill recommendation
  const sortedSkills = (Object.entries(state.skillScores) as [SkillDimension, number][]).sort(
    (a, b) => a[1] - b[1]
  );
  const weakestSkill = sortedSkills[0];

  const handleQuickCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickNote.trim()) return;
    quickCaptureObservation(
      quickTitle,
      quickTag,
      quickNote,
      activeModule.id
    );
    setQuickSavedBanner(`Saved "${quickTitle.trim()}" to Research Notebook as ${quickTag}.`);
    setQuickTitle('');
    setQuickNote('');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Operational Command Card - White Minimalist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 8 cols: Current Research Stage & Primary Continue Action */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Progression: {metrics.stage}
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="font-mono tabular-nums text-slate-700">
                  Competency Index: <strong className="text-slate-900">{metrics.overallSkillScore}%</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="goal-track-select" className="text-slate-500 font-medium">
                  Track:
                </label>
                <select
                  id="goal-track-select"
                  value={state.goalTrack}
                  onChange={(e) =>
                    setGoalTrack(e.target.value as typeof state.goalTrack)
                  }
                  className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-sky-600 focus:bg-white"
                >
                  {GOAL_TRACKS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight font-display">
              Alex Security Research Command Centre
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              {metrics.nextStageRequirement}
            </p>

            {/* Storage status banner */}
            <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-mono border border-slate-200 bg-slate-50 text-slate-600">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{indexedDbStatus}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-800 font-medium">
                {curriculumStructure.totalModules} Modules & {curriculumStructure.totalLabRequirements} Lab Requirements
              </span>
            </div>
          </div>

          {/* Active & Recommended Resume Box */}
          <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Active Workspace Session · Module {String(activeModule.number).padStart(2, '0')}
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                  {activeLesson.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {activeLesson.stageBadge} · {activeLesson.estimatedMinutes} min ·{' '}
                  {activeLesson.sourceReference.printedPage}
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() =>
                    navigate('lesson', {
                      moduleId: activeModule.id,
                      lessonId: activeLesson.id,
                    })
                  }
                  className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-xs"
                >
                  <BookOpen className="w-4 h-4 text-sky-400" />
                  <span>Continue Active Lesson</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Recommended Investigation · Prerequisite-Verified
                </div>
                <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                  {nextRecommendedLesson.title}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Why recommended:{' '}
                  {nextModuleUnlock.isUnlocked
                    ? `Advances ${SKILL_LABELS[weakestSkill[0]]}.`
                    : `Requires ${nextModuleUnlock.missingPrerequisiteIds.join(', ')} first.`}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate('labs', {
                      labId: nextRecommendedLesson.relatedLabId || 'lab-bola-v1-drift',
                    })
                  }
                  className="flex-1 px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Launch Lab</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate('lesson', {
                      moduleId: nextRecommendedModule.id,
                      lessonId: nextRecommendedLesson.id,
                    })
                  }
                  className="px-3 py-2 border border-slate-300 hover:bg-white text-slate-700 text-xs font-medium rounded-md transition-colors whitespace-nowrap bg-white"
                >
                  Open Lesson
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 cols: Rapid Research Capture Box */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-sky-700 font-mono font-semibold uppercase tracking-wider">
                Rapid Research Capture
              </div>
              <NotebookPen className="w-4 h-4 text-sky-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Log Observation or Hypothesis
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record protocol anomalies directly into IndexedDB-persisted Research Notebook.
            </p>

            <form onSubmit={handleQuickCaptureSubmit} className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="qc-title"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Investigation Title
                </label>
                <input
                  id="qc-title"
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="e.g. GraphQL mutation role check on /graphql"
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="qc-type"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Classification
                </label>
                <select
                  id="qc-type"
                  value={quickTag}
                  onChange={(e) =>
                    setQuickTag(
                      e.target.value as 'Observation' | 'Hypothesis' | 'Follow-up'
                    )
                  }
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:border-sky-600 focus:bg-white"
                >
                  <option value="Hypothesis">Testable Hypothesis</option>
                  <option value="Observation">Baseline Observation</option>
                  <option value="Follow-up">Follow-up Research Question</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="qc-note"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Hypothesis Statement or Traffic Note
                </label>
                <textarea
                  id="qc-note"
                  rows={3}
                  required
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder="If [invariant] is omitted on [endpoint], then mutating [variable] will produce..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Capture to Research Notebook</span>
              </button>
            </form>

            {quickSavedBanner && (
              <div
                role="status"
                className="mt-3 p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2"
              >
                <span>{quickSavedBanner}</span>
                <button
                  type="button"
                  onClick={() => navigate('notebook')}
                  className="underline font-semibold shrink-0"
                >
                  View
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4-Column Defensible Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Curriculum Reading vs. Mastery
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {metrics.masteredCount} / {LESSONS_CATALOG.length} Mastered
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {state.readingCompletedLessonIds.length} Read · {metrics.passedAssessmentCount} Assessed
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Mastery requires both passing the lesson knowledge check and completing controlled practice.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Independently Validated Labs
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-700 mt-1">
            {metrics.validatedLabsCount} / {INTERACTIVE_LABS.length} Labs
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {Object.keys(state.labAttempts).length} Attempted · False-Positives Filtered
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Counts only deterministic labs validated with a sound hypothesis and root-cause proof.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Research Notebook Hypotheses
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {metrics.confirmedHypothesesCount} Confirmed
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {unresolvedInvestigations.length} Unresolved ·{' '}
            {
              state.notebookInvestigations.filter((i) => i.verdict === 'Rejected')
                .length
            }{' '}
            Rejected (Saved)
          </div>
          <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
            Hypotheses require attached evidence records before confirmation is permitted.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Spaced-Repetition Queue
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
              {dueFlashcards.length} Cards Due
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
              {Object.keys(state.flashcardReviews).length} / {FLASHCARDS_DATA.length} Scheduled
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('review')}
            className="mt-3 text-xs text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-1 self-start"
          >
            <span>Start 5-Minute Retrieval Session</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Featured Real-World CVE Research Spotlight */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Real-World Vulnerability & CVE Case Studies
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate('curriculum')}
            className="text-xs font-medium text-sky-700 hover:underline flex items-center gap-1"
          >
            <span>Explore all 26 CVE Case Studies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-rose-700">CVE-2023-44487</span>
                <span className="text-slate-500">M01 · HTTP/2</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                Rapid Reset Stream Cancellation
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                RST_STREAM frames immediately cancelled streams without incurring backpressure or accounting cost.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('lesson', { moduleId: 'mod-01' })}
              className="mt-3 text-xs text-sky-700 font-semibold hover:underline self-start flex items-center gap-1"
            >
              <span>Study Protocol Fix</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-rose-700">CVE-2022-22965</span>
                <span className="text-slate-500">M01 · Spring4Shell</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                Path Normalization & ClassLoader RCE
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                Tomcat exposed accessLogValve through class.module.classLoader parameters during query property binding.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('labs', { labId: 'lab-http-baseline' })}
              className="mt-3 text-xs text-sky-700 font-semibold hover:underline self-start flex items-center gap-1"
            >
              <span>Launch Differential Lab</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-rose-700">CVE-2024-21626</span>
                <span className="text-slate-500">M20 · runc</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 mt-1">
                Leaky Vessels Container Breakout
              </div>
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                Host /sys/fs/cgroup file descriptors remained open across clone and execve, bypassing container root.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('workbenches')}
              className="mt-3 text-xs text-sky-700 font-semibold hover:underline self-start flex items-center gap-1"
            >
              <span>Trace Trust Boundary</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Row: 9-Dimension Skill Mastery Breakdown + Weekly Study Rhythm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 7 cols: 9-Dimension Skill Breakdown */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Demonstrated Research Skill Dimensions
              </h2>
              <p className="text-xs text-slate-500">
                Derived from verified assessments, controlled lab validations, and triage reports.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('review')}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md font-medium whitespace-nowrap shrink-0"
            >
              Inspect Mastery Map
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {(Object.entries(SKILL_LABELS) as [SkillDimension, string][]).map(
              ([key, label]) => {
                const val = state.skillScores[key] || 0;
                const isWeakest = weakestSkill[0] === key;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-800 font-medium">
                        {label}
                        {isWeakest && (
                          <span className="ml-2 text-amber-700 font-normal">
                            · Priority Focus Area
                          </span>
                        )}
                      </span>
                      <span className="font-mono tabular-nums text-slate-600 font-semibold">
                        {val}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full transition-all ${
                          val >= 70
                            ? 'bg-emerald-600'
                            : val >= 45
                            ? 'bg-sky-600'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, val))}%` }}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* 5 cols: Weekly Study Activity & Target */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Weekly Research Activity
                </h2>
                <p className="text-xs text-slate-500">
                  Rest days never erase progress or penalize mastery.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <Target className="w-3.5 h-3.5 text-sky-700" />
                <label htmlFor="daily-target-input" className="text-slate-500 font-medium">
                  Target:
                </label>
                <input
                  id="daily-target-input"
                  type="number"
                  min={10}
                  max={240}
                  step={5}
                  value={state.dailyTargetMinutes}
                  onChange={(e) => setDailyTargetMinutes(Number(e.target.value))}
                  className="w-14 px-1.5 py-0.5 bg-slate-50 border border-slate-300 rounded text-right font-mono tabular-nums text-slate-800"
                />
                <span className="text-slate-500">m/d</span>
              </div>
            </div>

            {/* 7-Day Activity Bars */}
            <div className="mt-4 grid grid-cols-7 gap-2 items-end h-32 pt-4 px-2 bg-slate-50 border border-slate-200 rounded-lg">
              {state.weeklyStudyMinutes.map((mins, idx) => {
                const pct = Math.min(
                  100,
                  Math.round((mins / Math.max(1, state.dailyTargetMinutes)) * 100)
                );
                const metTarget = mins >= state.dailyTargetMinutes;
                return (
                  <div
                    key={DAYS[idx]}
                    className="flex flex-col items-center justify-end h-full gap-1"
                  >
                    <span className="text-[10px] font-mono tabular-nums text-slate-500">
                      {mins}m
                    </span>
                    <div className="w-full bg-slate-200 rounded-t h-20 flex items-end overflow-hidden">
                      <div
                        className={`w-full transition-all ${
                          metTarget ? 'bg-emerald-600' : 'bg-sky-600'
                        }`}
                        style={{ height: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600 pb-1">
                      {DAYS[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action queue */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-sky-700" />
              <span>Recommended Research Queue</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <div className="text-slate-900 font-semibold">
                    Strengthen: {SKILL_LABELS[weakestSkill[0]]} ({weakestSkill[1]}%)
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Complete Mystery Lab or Case Study 01 to build root-cause proof.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('cases')}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium rounded-md whitespace-nowrap shrink-0 text-xs shadow-2xs"
                >
                  Open Case
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <div className="text-slate-900 font-semibold">
                    False-Positive Rejection Drill (Case Study 02)
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Verify why uncached `X-Forwarded-Host` reflection is not Web Cache Poisoning.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate('cases', { caseStudyId: 'case-fp-cdn-echo' })
                  }
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium rounded-md whitespace-nowrap shrink-0 text-xs shadow-2xs"
                >
                  Investigate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Curriculum Overview Strip & Safe Reset Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              26-Module Curriculum Completion Map
            </h2>
            <p className="text-xs text-slate-500">
              Select any module below to open its lessons, prerequisite graph, and linked synthetic labs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('curriculum')}
              className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md whitespace-nowrap shrink-0 shadow-xs"
            >
              Open Full 26-Module Explorer
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 text-xs border border-slate-300 hover:border-rose-600 text-slate-600 hover:text-rose-700 bg-white rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>
        </div>

        {showResetConfirm && (
          <div
            role="alertdialog"
            aria-label="Confirm workspace reset"
            className="my-4 p-4 rounded-lg border border-rose-300 bg-rose-50 flex flex-wrap items-center justify-between gap-4 text-xs"
          >
            <div className="flex items-center gap-2 text-rose-800 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Confirm Destructive Action: Reset all local progress, lab attempts, and custom notebook entries back to factory seed state?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetAllProgress();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md whitespace-nowrap shadow-xs"
              >
                Confirm Reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-13 gap-2">
          {curriculumStructure.modules.map((mod) => {
            const isMastered = mod.lessonIds.every((id) =>
              state.masteredLessonIds.includes(id)
            );
            const isAssessed = mod.lessonIds.some((id) =>
              state.assessmentPassedLessonIds.includes(id)
            );
            const unlock = evaluateModuleUnlockStatus(mod, curriculumStructure.modules, state);

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() =>
                  navigate('lesson', {
                    moduleId: mod.id,
                    lessonId: mod.lessonIds[0],
                  })
                }
                title={`Module ${mod.number}: ${mod.title}`}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isMastered
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold shadow-2xs'
                    : isAssessed
                    ? 'border-sky-300 bg-sky-50 text-sky-900'
                    : unlock.isUnlocked
                    ? 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-white'
                    : 'border-slate-200 bg-slate-100/60 text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums">
                  <span className="font-bold">M{String(mod.number).padStart(2, '0')}</span>
                  {isMastered && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                </div>
                <div className="text-[11px] truncate mt-1">
                  {mod.shortTitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
