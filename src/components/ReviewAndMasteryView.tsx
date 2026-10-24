import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  CURRICULUM_MODULES,
  FLASHCARDS_DATA,
} from '../data/curriculumData';
import { calculateProgressionMetrics } from '../utils/researchEngine';
import {
  Award,
  Bookmark,
  Brain,
  CheckCircle2,
  Clock,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const PROGRESSION_TIERS = [
  {
    stage: 'Beginner',
    criteria: 'Entry stage: building HTTP framing, cookie/CORS, and baseline observation habits.',
  },
  {
    stage: 'Competent',
    criteria: '2+ Lesson Assessments passed & 1+ Interactive Lab independently validated.',
  },
  {
    stage: 'Intermediate',
    criteria: '3+ Lessons Mastered, 2+ Labs Validated, & 1+ Confirmed Evidence-Backed Hypothesis.',
  },
  {
    stage: 'Advanced',
    criteria: '5+ Lessons Mastered, 3+ Labs Validated, 2+ Confirmed Hypotheses, & 50%+ Competency Index.',
  },
  {
    stage: 'Specialist',
    criteria: '8+ Lessons Mastered, 4+ Labs Validated, 3+ Confirmed Hypotheses, & 65%+ Competency Index.',
  },
  {
    stage: 'Independent Researcher',
    criteria: '12+ Lessons Mastered, 6+ Labs Validated, 4+ Confirmed Hypotheses, & 80%+ Competency Index.',
  },
];

export const ReviewAndMasteryView: React.FC = () => {
  const {
    state,
    navigate,
    recordFlashcardReview,
    toggleFlashcardFlag,
  } = useAcademy();

  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const [sessionWindowMins, setSessionWindowMins] = useState<5 | 15 | 30>(15);
  const [userDraftResponse, setUserDraftResponse] = useState<string>('');
  const [hintRevealed, setHintRevealed] = useState<boolean>(false);
  const [answerRevealed, setAnswerRevealed] = useState<boolean>(false);

  // Socratic Mentor state (deterministic offline fallback)
  const [socraticInput, setSocraticInput] = useState<string>(
    'If I change user_id=101 to user_id=102 on /api/v1/invoices, I think it is vulnerable to BOLA.'
  );
  const [socraticCritique, setSocraticCritique] = useState<{
    strengths: string[];
    probingQuestions: string[];
    verifiedCitation: string;
  } | null>(null);

  const card = FLASHCARDS_DATA[activeCardIdx] || FLASHCARDS_DATA[0];
  const cardReview = state.flashcardReviews[card.id];
  const cardModule = CURRICULUM_MODULES.find((m) => m.id === card.moduleId);
  const metrics = calculateProgressionMetrics(state);

  const handleRateConfidence = (confidence: 1 | 2 | 3 | 4 | 5) => {
    recordFlashcardReview(card.id, confidence, hintRevealed);
    setUserDraftResponse('');
    setHintRevealed(false);
    setAnswerRevealed(false);
    setActiveCardIdx((i) => (i + 1) % FLASHCARDS_DATA.length);
  };

  const handleRunSocraticReview = (e: React.FormEvent) => {
    e.preventDefault();
    const norm = socraticInput.toLowerCase();
    const strengths: string[] = [];
    const probingQuestions: string[] = [];

    if (norm.includes('if ') || norm.includes('when ')) {
      strengths.push('Structured as a conditional cause-and-effect statement.');
    } else {
      probingQuestions.push(
        'Restate your claim as a falsifiable conditional: "If [boundary check X] is missing, then mutating [single variable Y] will produce [observable evidence Z]."'
      );
    }

    if (norm.includes('tenant') || norm.includes('user_id') || norm.includes('bola') || norm.includes('token')) {
      strengths.push('Identifies an authorization/identity parameter as the independent variable.');
      probingQuestions.push(
        'How did you verify that object `102` belongs to a separate private tenant/account you control rather than a public catalog item?'
      );
    } else {
      probingQuestions.push(
        'Which specific trust boundary (Edge Proxy, Controller ACL, Vector Retriever, or Database Predicate) is being crossed?'
      );
    }

    probingQuestions.push(
      'What benign explanation (e.g., SPA 200 OK fallback, uncached header reflection, or intended public field) must you rule out before confirming?'
    );

    setSocraticCritique({
      strengths:
        strengths.length > 0
          ? strengths
          : ['Initial observation captured for structured refinement.'],
      probingQuestions,
      verifiedCitation:
        'Verified Reference: Bug Bounty Engineering (2026), Ch. 6 · §6.1–6.4 (Printed pp. 149–174 / PDF pp. 157–182) & Ch. 25 · §25.2 Proof Obligations (Printed pp. 815–824).',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200 mb-2">
            Spaced-Repetition Retrieval Practice · Progression Map · Socratic Hypothesis Mentor
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Retrieval Practice, Mastery Map & Socratic Review
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Independent recall is tracked separately from hinted answers using a deterministic SM-2 interval scheduler.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600 font-medium">Session:</span>
          {([5, 15, 30] as const).map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setSessionWindowMins(mins)}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-medium transition-colors ${
                sessionWindowMins === mins
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Main Split: Active Spaced-Repetition Card (7 cols) + Socratic Hypothesis Tutor (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Active Flashcard */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sky-800">
                Card {activeCardIdx + 1} of {FLASHCARDS_DATA.length}
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Type: {card.questionType}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFlashcardFlag(card.id)}
                className={`px-2.5 py-1 rounded-md border flex items-center gap-1 font-medium transition-colors ${
                  cardReview?.flaggedForReview
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{cardReview?.flaggedForReview ? 'Flagged' : 'Flag'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate('lesson', {
                    moduleId: card.moduleId,
                    lessonId: card.lessonId,
                  })
                }
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md font-medium"
              >
                Lesson ({cardModule?.shortTitle})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs text-slate-600 font-mono">
              Concept: <strong className="text-slate-900 font-bold">{card.conceptName}</strong>
              {cardReview && (
                <span className="ml-3 text-slate-500">
                  Interval: {cardReview.intervalDays}d · Recalls:{' '}
                  {cardReview.independentSuccessCount} · Hinted: {cardReview.hintedAttemptCount}
                </span>
              )}
            </div>

            <h2 className="text-base font-bold text-slate-900 leading-relaxed">
              {card.prompt}
            </h2>

            {card.contextSnippet && (
              <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100 overflow-x-auto leading-relaxed">
                {card.contextSnippet}
              </pre>
            )}
          </div>

          {/* Active Recall Input */}
          <div className="space-y-2 text-xs">
            <label htmlFor="recall-draft" className="block text-slate-700 font-semibold">
              Formulate Your Explanation / Invariant Answer Before Revealing:
            </label>
            <textarea
              id="recall-draft"
              rows={3}
              value={userDraftResponse}
              onChange={(e) => setUserDraftResponse(e.target.value)}
              placeholder="Write your explanation in your own words to strengthen active retrieval..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Hint & Reveal Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setHintRevealed(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Reveal Conceptual Hint</span>
            </button>
            <button
              type="button"
              onClick={() => setAnswerRevealed(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs min-h-[38px]"
            >
              Reveal Verified Answer & Rate Confidence
            </button>
          </div>

          {hintRevealed && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
              <strong>Hint:</strong> {card.hint}
            </div>
          )}

          {answerRevealed && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3 text-xs">
              <div>
                <div className="font-bold text-emerald-900 text-sm">
                  Verified Reference Answer:
                </div>
                <p className="text-slate-800 mt-1 leading-relaxed">
                  {card.idealAnswer}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-sky-900 font-mono text-[11px]">
                <strong>Key Invariant:</strong> {card.keyInvariantCheck}
              </div>

              <div className="pt-2 space-y-2">
                <div className="font-bold text-slate-900">
                  Rate Recall Confidence (Schedules Next SM-2 Interval):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { c: 1 as const, label: '1 · Missed' },
                    { c: 2 as const, label: '2 · Hard' },
                    { c: 3 as const, label: '3 · Partial' },
                    { c: 4 as const, label: '4 · Solid' },
                    { c: 5 as const, label: '5 · Mastered' },
                  ].map((btn) => (
                    <button
                      key={btn.c}
                      type="button"
                      onClick={() => handleRateConfidence(btn.c)}
                      className="py-2 px-2 bg-white hover:bg-slate-900 hover:text-white border border-slate-300 rounded-lg font-mono text-xs text-slate-800 font-semibold transition-colors shadow-xs"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 5 cols: Deterministic Socratic Research Mentor */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
          <div>
            <div className="font-mono text-sky-800 font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Socratic Research Mentor (Local Deterministic Engine)</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">
              Review Hypothesis & Identify Unsupported Claims
            </h2>
            <p className="text-slate-600 mt-1 leading-relaxed">
              Evaluates your proposed hypothesis for independent variable clarity, false-positive traps, and textbook citations.
            </p>
          </div>

          <form onSubmit={handleRunSocraticReview} className="space-y-3">
            <label htmlFor="socratic-input" className="block text-slate-700 font-semibold">
              Enter Proposed Hypothesis or Vulnerability Claim:
            </label>
            <textarea
              id="socratic-input"
              rows={3}
              value={socraticInput}
              onChange={(e) => setSocraticInput(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs min-h-[40px]"
            >
              Run Socratic Hypothesis Critique
            </button>
          </form>

          {socraticCritique && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <div className="font-bold text-emerald-900">
                  Structural Strengths:
                </div>
                <ul className="list-disc list-inside text-slate-700 mt-1 space-y-1">
                  {socraticCritique.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-bold text-amber-900">
                  Socratic Probing Questions Before Confirming:
                </div>
                <ul className="list-disc list-inside text-slate-700 mt-1 space-y-1">
                  {socraticCritique.probingQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200 font-mono text-[11px] text-slate-600">
                {socraticCritique.verifiedCitation}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progression Tiers & Transparent Advancement Criteria */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Researcher Progression Tiers & Transparent Criteria
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Advancement is calculated strictly from demonstrated mastery, validated labs, and evidence-backed hypotheses—never from page views alone.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 shrink-0">
            Current Tier: <strong>{metrics.stage}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {PROGRESSION_TIERS.map((t, idx) => {
            const isCurrent = t.stage === metrics.stage;
            return (
              <div
                key={t.stage}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-800'
                }`}
              >
                <div>
                  <div className={`font-mono text-[11px] ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                    Tier 0{idx + 1}
                  </div>
                  <div className="font-bold text-sm mt-0.5">{t.stage}</div>
                  <p className={`text-[11px] mt-1.5 leading-relaxed ${isCurrent ? 'text-slate-200' : 'text-slate-600'}`}>
                    {t.criteria}
                  </p>
                </div>
                {isCurrent && (
                  <div className="mt-3 pt-2 border-t border-slate-700 text-sky-300 font-mono text-[11px] font-semibold">
                    ● ACTIVE STAGE
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
