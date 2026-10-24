import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ApiEndpointInventoryItem,
  CurriculumModuleDefinition,
  CurriculumStructure,
  ExploitChainModel,
  HypothesisVerdict,
  InteractiveLab,
  LearnerState,
  LessonAnnotation,
  NotebookInvestigation,
  SkillDimension,
  VulnerabilityReportDraft,
} from '../types/domain';
import {
  INITIAL_API_INVENTORY,
  INITIAL_EXPLOIT_CHAINS,
  INITIAL_NOTEBOOK_INVESTIGATIONS,
  INITIAL_REPORTS,
} from '../data/labsAndCasesData';
import {
  LESSONS_CATALOG,
  MASTER_CURRICULUM_STRUCTURE,
} from '../data/curriculumData';
import {
  evaluateLabSubmission,
  LabEvaluationResult,
  scheduleFlashcardReview,
  validateHypothesisVerdictUpdate,
} from '../utils/researchEngine';
import { indexedDbStorage } from '../utils/indexedDbStorage';

const STORAGE_KEY = 'alex_security_academy_state_v2';
const CURRENT_SCHEMA_VERSION = 2;

export function createDefaultLearnerState(): LearnerState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activeRoute: 'dashboard',
    activeModuleId: 'mod-01',
    activeLessonId: 'les-01-1',
    activeLabId: 'lab-http-baseline',
    activeCaseStudyId: 'case-cross-tenant-bola',
    goalTrack: 'Full-Spectrum Security Researcher',
    dailyTargetMinutes: 45,
    weeklyStudyMinutes: [35, 50, 40, 60, 25, 45, 30],
    readingCompletedLessonIds: ['les-01-1'],
    assessmentPassedLessonIds: ['les-01-1'],
    masteredLessonIds: ['les-01-1'],
    skippedPrerequisiteModuleIds: [],
    skillScores: {
      conceptualUnderstanding: 42,
      protocolInterpretation: 48,
      experimentalDesign: 40,
      evidenceQuality: 45,
      authorizationReasoning: 52,
      falsePositiveRejection: 50,
      rootCauseExplanation: 38,
      impactAnalysis: 36,
      reportQuality: 44,
    },
    labAttempts: {},
    caseStudyAttempts: {},
    flashcardReviews: {},
    notebookInvestigations: INITIAL_NOTEBOOK_INVESTIGATIONS,
    lessonAnnotations: [
      {
        id: 'ann-seed-1',
        lessonId: 'les-01-1',
        tag: 'Hypothesis',
        content:
          'When an Envoy gateway returns X-Rejected-By: Edge-Gateway-ACL, test whether matrix parameters (;param=1) alter origin servlet normalization.',
        createdAt: '2026-10-23',
      },
    ],
    apiInventory: INITIAL_API_INVENTORY,
    exploitChains: INITIAL_EXPLOIT_CHAINS,
    reports: INITIAL_REPORTS,
    theme: 'light',
    readingMode: false,
  };
}

function loadPersistedState(): { state: LearnerState; recoveryNotice: string | null } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: createDefaultLearnerState(), recoveryNotice: null };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.schemaVersion !== 'number') {
      return {
        state: createDefaultLearnerState(),
        recoveryNotice:
          'Corrupted or unrecognized local state schema detected; restored clean baseline state safely.',
      };
    }
    const defaults = createDefaultLearnerState();
    const migrated: LearnerState = {
      ...defaults,
      ...parsed,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      skillScores: { ...defaults.skillScores, ...(parsed.skillScores || {}) },
    };
    return { state: migrated, recoveryNotice: null };
  } catch {
    return {
      state: createDefaultLearnerState(),
      recoveryNotice:
        'Saved state could not be parsed; recovered with verified default workspace state.',
    };
  }
}

interface AcademyContextValue {
  state: LearnerState;
  recoveryNotice: string | null;
  dismissRecoveryNotice: () => void;
  navigate: (
    route: string,
    params?: {
      moduleId?: string;
      lessonId?: string;
      labId?: string;
      caseStudyId?: string;
    }
  ) => void;
  toggleTheme: () => void;
  toggleReadingMode: () => void;
  setGoalTrack: (track: LearnerState['goalTrack']) => void;
  setDailyTargetMinutes: (minutes: number) => void;
  markLessonReadingCompleted: (lessonId: string) => void;
  recordLessonAssessmentPassed: (
    lessonId: string,
    controlledPracticeCompleted: boolean
  ) => void;
  toggleSkipPrerequisiteOverride: (moduleId: string) => void;
  addLessonAnnotation: (
    lessonId: string,
    tag: LessonAnnotation['tag'],
    content: string
  ) => void;
  deleteLessonAnnotation: (annotationId: string) => void;
  submitLabAttempt: (
    lab: InteractiveLab,
    submission: {
      hypothesisText: string;
      selectedPresetId: string;
      falsePositiveOptionId: string;
      rootCauseOptionId: string;
      hintsUsed: number;
      solutionViewed: boolean;
    }
  ) => LabEvaluationResult;
  resetLabAttempt: (labId: string) => void;
  commitCaseStudyStepHypothesis: (
    caseStudyId: string,
    stepIndex: number,
    choiceId: string,
    creditLevel: 'primary' | 'defensible-alternative' | 'unsupported',
    totalPackets: number
  ) => void;
  saveCaseStudyConclusion: (caseStudyId: string, conclusionText: string) => void;
  resetCaseStudyAttempt: (caseStudyId: string) => void;
  recordFlashcardReview: (
    cardId: string,
    confidence: 1 | 2 | 3 | 4 | 5,
    usedHint: boolean
  ) => void;
  toggleFlashcardFlag: (cardId: string) => void;
  createInvestigation: (
    inv: Omit<NotebookInvestigation, 'id' | 'changeHistory' | 'updatedAt'>
  ) => string;
  updateInvestigationVerdict: (
    invId: string,
    verdict: HypothesisVerdict,
    exceptionRationale?: string
  ) => { allowed: boolean; error?: string; warning?: string };
  addEvidenceToInvestigation: (
    invId: string,
    title: string,
    snapshot: string,
    invariantState: string
  ) => void;
  addExperimentToInvestigation: (
    invId: string,
    exp: {
      description: string;
      independentVariable: string;
      expectedResult: string;
      actualResult: string;
      verdict: HypothesisVerdict;
      rationale: string;
    }
  ) => void;
  deleteInvestigation: (invId: string) => void;
  quickCaptureObservation: (
    title: string,
    tag: LessonAnnotation['tag'],
    hypothesisOrNote: string,
    moduleId: string
  ) => void;
  addApiInventoryItems: (items: ApiEndpointInventoryItem[]) => void;
  updateApiInventoryStatus: (
    id: string,
    observedResult: ApiEndpointInventoryItem['observedResult'],
    confidence: ApiEndpointInventoryItem['confidence'],
    evidenceRef: string
  ) => void;
  saveExploitChain: (chain: ExploitChainModel) => void;
  saveReportDraft: (report: VulnerabilityReportDraft) => void;
  importValidatedState: (partial: Partial<LearnerState>) => void;
  resetAllProgress: () => void;
  curriculumStructure: CurriculumStructure;
  isIndexedDbReady: boolean;
  indexedDbStatus: string;
  updateCurriculumModule: (moduleDef: CurriculumModuleDefinition) => Promise<void>;
  reloadCurriculumFromIndexedDb: () => Promise<void>;
}

const AcademyContext = createContext<AcademyContextValue | null>(null);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [{ state, recoveryNotice }, setLoaded] = useState(() => loadPersistedState());
  const [curriculumStructure, setCurriculumStructure] = useState<CurriculumStructure>(
    () => MASTER_CURRICULUM_STRUCTURE
  );
  const [isIndexedDbReady, setIsIndexedDbReady] = useState(false);
  const [indexedDbStatus, setIndexedDbStatus] = useState('Initializing IndexedDB...');

  // Initialize and synchronize with IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function initIndexedDb() {
      if (!indexedDbStorage.isSupported()) {
        if (isMounted) {
          setIsIndexedDbReady(false);
          setIndexedDbStatus('IndexedDB not supported in environment (local storage active)');
        }
        return;
      }
      try {
        // 1. Check if curriculum structure exists in IndexedDB
        const storedStructure = await indexedDbStorage.fetchCurriculumStructure();
        if (storedStructure && storedStructure.modules && storedStructure.modules.length === 26) {
          if (isMounted) {
            setCurriculumStructure(storedStructure);
          }
        } else {
          // Seed master curriculum into IndexedDB
          await indexedDbStorage.persistCurriculumStructure(MASTER_CURRICULUM_STRUCTURE, LESSONS_CATALOG);
        }

        // 2. Check if learner state exists in IndexedDB
        const idbState = await indexedDbStorage.fetchLearnerState();
        if (idbState && idbState.schemaVersion === CURRENT_SCHEMA_VERSION) {
          if (isMounted) {
            setLoaded({ state: idbState, recoveryNotice: null });
          }
        }

        if (isMounted) {
          setIsIndexedDbReady(true);
          setIndexedDbStatus('IndexedDB Connected & Synchronized');
        }
      } catch {
        if (isMounted) {
          setIsIndexedDbReady(false);
          setIndexedDbStatus('IndexedDB fallback to LocalStorage');
        }
      }
    }

    initIndexedDb();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors gracefully
    }
    // Asynchronously save to IndexedDB
    if (indexedDbStorage.isSupported()) {
      indexedDbStorage.persistLearnerState(state).catch(() => {});
    }
  }, [state]);

  const updateCurriculumModule = async (moduleDef: CurriculumModuleDefinition) => {
    setCurriculumStructure((prev) => {
      const updatedModules = prev.modules.map((m) => (m.id === moduleDef.id ? moduleDef : m));
      const next: CurriculumStructure = {
        ...prev,
        lastSynchronizedAt: new Date().toISOString(),
        modules: updatedModules,
      };
      if (indexedDbStorage.isSupported()) {
        indexedDbStorage.persistCurriculumStructure(next).catch(() => {});
      }
      return next;
    });
  };

  const reloadCurriculumFromIndexedDb = async () => {
    if (!indexedDbStorage.isSupported()) return;
    const stored = await indexedDbStorage.fetchCurriculumStructure();
    if (stored) {
      setCurriculumStructure(stored);
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [state.theme]);

  const updateState = (updater: (prev: LearnerState) => LearnerState) => {
    setLoaded((prev) => ({ ...prev, state: updater(prev.state) }));
  };

  const navigate: AcademyContextValue['navigate'] = (route, params) => {
    updateState((prev) => ({
      ...prev,
      activeRoute: route,
      activeModuleId: params?.moduleId ?? prev.activeModuleId,
      activeLessonId: params?.lessonId ?? prev.activeLessonId,
      activeLabId: params?.labId ?? prev.activeLabId,
      activeCaseStudyId: params?.caseStudyId ?? prev.activeCaseStudyId,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    updateState((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const toggleReadingMode = () => {
    updateState((prev) => ({ ...prev, readingMode: !prev.readingMode }));
  };

  const setGoalTrack = (goalTrack: LearnerState['goalTrack']) => {
    updateState((prev) => ({ ...prev, goalTrack }));
  };

  const setDailyTargetMinutes = (dailyTargetMinutes: number) => {
    updateState((prev) => ({
      ...prev,
      dailyTargetMinutes: Math.max(10, Math.min(240, dailyTargetMinutes)),
    }));
  };

  const markLessonReadingCompleted = (lessonId: string) => {
    updateState((prev) => {
      if (prev.readingCompletedLessonIds.includes(lessonId)) return prev;
      const updatedWeekly = [...prev.weeklyStudyMinutes];
      updatedWeekly[6] = (updatedWeekly[6] || 0) + 15;
      return {
        ...prev,
        readingCompletedLessonIds: [...prev.readingCompletedLessonIds, lessonId],
        weeklyStudyMinutes: updatedWeekly,
      };
    });
  };

  const recordLessonAssessmentPassed = (
    lessonId: string,
    controlledPracticeCompleted: boolean
  ) => {
    updateState((prev) => {
      const readingSet = new Set([...prev.readingCompletedLessonIds, lessonId]);
      const passedSet = new Set([...prev.assessmentPassedLessonIds, lessonId]);
      const masteredSet = new Set(prev.masteredLessonIds);
      if (controlledPracticeCompleted) {
        masteredSet.add(lessonId);
      }
      const nextSkills = { ...prev.skillScores };
      nextSkills.conceptualUnderstanding = Math.min(
        100,
        nextSkills.conceptualUnderstanding + 4
      );
      nextSkills.falsePositiveRejection = Math.min(
        100,
        nextSkills.falsePositiveRejection + 3
      );
      return {
        ...prev,
        readingCompletedLessonIds: Array.from(readingSet),
        assessmentPassedLessonIds: Array.from(passedSet),
        masteredLessonIds: Array.from(masteredSet),
        skillScores: nextSkills,
      };
    });
  };

  const toggleSkipPrerequisiteOverride = (moduleId: string) => {
    updateState((prev) => {
      const exists = prev.skippedPrerequisiteModuleIds.includes(moduleId);
      return {
        ...prev,
        skippedPrerequisiteModuleIds: exists
          ? prev.skippedPrerequisiteModuleIds.filter((id) => id !== moduleId)
          : [...prev.skippedPrerequisiteModuleIds, moduleId],
      };
    });
  };

  const addLessonAnnotation: AcademyContextValue['addLessonAnnotation'] = (
    lessonId,
    tag,
    content
  ) => {
    if (!content.trim()) return;
    const newAnn: LessonAnnotation = {
      id: `ann-${Date.now()}`,
      lessonId,
      tag,
      content: content.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    updateState((prev) => ({
      ...prev,
      lessonAnnotations: [newAnn, ...prev.lessonAnnotations],
    }));
  };

  const deleteLessonAnnotation = (annotationId: string) => {
    updateState((prev) => ({
      ...prev,
      lessonAnnotations: prev.lessonAnnotations.filter((a) => a.id !== annotationId),
    }));
  };

  const submitLabAttempt: AcademyContextValue['submitLabAttempt'] = (
    lab,
    submission
  ) => {
    const evalResult = evaluateLabSubmission(lab, submission);
    updateState((prev) => {
      const existing = prev.labAttempts[lab.id];
      const nextSkills = { ...prev.skillScores };
      if (evalResult.passed && !existing?.completed && !submission.solutionViewed) {
        for (const [k, delta] of Object.entries(evalResult.skillRewards)) {
          const key = k as SkillDimension;
          nextSkills[key] = Math.min(100, (nextSkills[key] || 0) + (delta || 0));
        }
      }
      return {
        ...prev,
        skillScores: nextSkills,
        labAttempts: {
          ...prev.labAttempts,
          [lab.id]: {
            labId: lab.id,
            completed: evalResult.passed || Boolean(existing?.completed),
            hypothesisSubmitted: submission.hypothesisText,
            selectedPresetId: submission.selectedPresetId,
            falsePositiveCheckPassed: evalResult.falsePositiveHandled,
            rootCausePassed: evalResult.rootCauseValid,
            hintsUsed: submission.hintsUsed,
            solutionViewed: submission.solutionViewed || Boolean(existing?.solutionViewed),
            attemptsCount: (existing?.attemptsCount || 0) + 1,
            lastAttemptAt: new Date().toISOString().slice(0, 10),
          },
        },
      };
    });
    return evalResult;
  };

  const resetLabAttempt = (labId: string) => {
    updateState((prev) => {
      const next = { ...prev.labAttempts };
      delete next[labId];
      return { ...prev, labAttempts: next };
    });
  };

  const commitCaseStudyStepHypothesis: AcademyContextValue['commitCaseStudyStepHypothesis'] = (
    caseStudyId,
    stepIndex,
    choiceId,
    creditLevel,
    totalPackets
  ) => {
    updateState((prev) => {
      const existing = prev.caseStudyAttempts[caseStudyId] || {
        caseStudyId,
        unlockedStepIndex: 0,
        completed: false,
        committedHypotheses: {},
        finalConclusionText: '',
        reasoningScore: 0,
        updatedAt: new Date().toISOString().slice(0, 10),
      };

      const scoreAdd =
        creditLevel === 'primary' ? 50 : creditLevel === 'defensible-alternative' ? 40 : 10;
      const nextUnlocked = Math.min(totalPackets, Math.max(existing.unlockedStepIndex, stepIndex + 1));
      const isNowComplete = nextUnlocked >= totalPackets;

      return {
        ...prev,
        caseStudyAttempts: {
          ...prev.caseStudyAttempts,
          [caseStudyId]: {
            ...existing,
            unlockedStepIndex: nextUnlocked,
            completed: isNowComplete || existing.completed,
            committedHypotheses: {
              ...existing.committedHypotheses,
              [stepIndex]: choiceId,
            },
            reasoningScore: Math.min(100, existing.reasoningScore + scoreAdd),
            updatedAt: new Date().toISOString().slice(0, 10),
          },
        },
      };
    });
  };

  const saveCaseStudyConclusion = (caseStudyId: string, conclusionText: string) => {
    updateState((prev) => {
      const existing = prev.caseStudyAttempts[caseStudyId];
      if (!existing) return prev;
      return {
        ...prev,
        caseStudyAttempts: {
          ...prev.caseStudyAttempts,
          [caseStudyId]: {
            ...existing,
            finalConclusionText: conclusionText,
            completed: true,
            updatedAt: new Date().toISOString().slice(0, 10),
          },
        },
      };
    });
  };

  const resetCaseStudyAttempt = (caseStudyId: string) => {
    updateState((prev) => {
      const next = { ...prev.caseStudyAttempts };
      delete next[caseStudyId];
      return { ...prev, caseStudyAttempts: next };
    });
  };

  const recordFlashcardReview: AcademyContextValue['recordFlashcardReview'] = (
    cardId,
    confidence,
    usedHint
  ) => {
    updateState((prev) => {
      const existing = prev.flashcardReviews[cardId];
      const nextReview = scheduleFlashcardReview(
        existing,
        cardId,
        confidence,
        usedHint,
        Date.now()
      );
      return {
        ...prev,
        flashcardReviews: {
          ...prev.flashcardReviews,
          [cardId]: nextReview,
        },
      };
    });
  };

  const toggleFlashcardFlag = (cardId: string) => {
    updateState((prev) => {
      const existing = prev.flashcardReviews[cardId] || {
        cardId,
        intervalDays: 0,
        easeFactor: 2.5,
        repetitions: 0,
        dueTimestamp: Date.now(),
        lastConfidence: 3 as const,
        independentSuccessCount: 0,
        hintedAttemptCount: 0,
        flaggedForReview: false,
      };
      return {
        ...prev,
        flashcardReviews: {
          ...prev.flashcardReviews,
          [cardId]: {
            ...existing,
            flaggedForReview: !existing.flaggedForReview,
          },
        },
      };
    });
  };

  const createInvestigation: AcademyContextValue['createInvestigation'] = (inv) => {
    const id = `inv-${Date.now()}`;
    const now = new Date().toISOString().slice(0, 10);
    const record: NotebookInvestigation = {
      ...inv,
      id,
      changeHistory: [{ timestamp: now, summary: 'Investigation initialized' }],
      updatedAt: now,
    };
    updateState((prev) => ({
      ...prev,
      notebookInvestigations: [record, ...prev.notebookInvestigations],
    }));
    return id;
  };

  const updateInvestigationVerdict: AcademyContextValue['updateInvestigationVerdict'] = (
    invId,
    verdict,
    exceptionRationale
  ) => {
    const target = state.notebookInvestigations.find((i) => i.id === invId);
    if (!target) {
      return { allowed: false, error: 'Investigation not found.' };
    }
    const check = validateHypothesisVerdictUpdate(target, verdict, exceptionRationale);
    if (!check.allowed) {
      return check;
    }
    const now = new Date().toISOString().slice(0, 10);
    updateState((prev) => ({
      ...prev,
      notebookInvestigations: prev.notebookInvestigations.map((item) =>
        item.id === invId
          ? {
              ...item,
              verdict,
              exceptionRationale: exceptionRationale || item.exceptionRationale,
              changeHistory: [
                ...item.changeHistory,
                { timestamp: now, summary: `Verdict updated to ${verdict}` },
              ],
              updatedAt: now,
            }
          : item
      ),
    }));
    return check;
  };

  const addEvidenceToInvestigation: AcademyContextValue['addEvidenceToInvestigation'] = (
    invId,
    title,
    snapshot,
    invariantState
  ) => {
    const now = new Date().toISOString().slice(0, 10);
    const evId = `EV-${Math.floor(1000 + Math.random() * 9000)}`;
    updateState((prev) => ({
      ...prev,
      notebookInvestigations: prev.notebookInvestigations.map((item) =>
        item.id === invId
          ? {
              ...item,
              evidenceRecords: [
                ...item.evidenceRecords,
                {
                  id: evId,
                  title,
                  requestResponseSnapshot: snapshot,
                  observedInvariantState: invariantState,
                  createdAt: now,
                },
              ],
              changeHistory: [
                ...item.changeHistory,
                { timestamp: now, summary: `Added evidence record ${evId}: ${title}` },
              ],
              updatedAt: now,
            }
          : item
      ),
    }));
  };

  const addExperimentToInvestigation: AcademyContextValue['addExperimentToInvestigation'] = (
    invId,
    exp
  ) => {
    const now = new Date().toISOString().slice(0, 10);
    updateState((prev) => ({
      ...prev,
      notebookInvestigations: prev.notebookInvestigations.map((item) =>
        item.id === invId
          ? {
              ...item,
              experiments: [
                ...item.experiments,
                {
                  ...exp,
                  id: `exp-${Date.now()}`,
                  createdAt: now,
                },
              ],
              changeHistory: [
                ...item.changeHistory,
                {
                  timestamp: now,
                  summary: `Logged controlled experiment (${exp.independentVariable}) -> ${exp.verdict}`,
                },
              ],
              updatedAt: now,
            }
          : item
      ),
    }));
  };

  const deleteInvestigation = (invId: string) => {
    updateState((prev) => ({
      ...prev,
      notebookInvestigations: prev.notebookInvestigations.filter((i) => i.id !== invId),
    }));
  };

  const quickCaptureObservation: AcademyContextValue['quickCaptureObservation'] = (
    title,
    tag,
    hypothesisOrNote,
    moduleId
  ) => {
    const now = new Date().toISOString().slice(0, 10);
    const newInv: NotebookInvestigation = {
      id: `inv-qc-${Date.now()}`,
      title: title.trim() || 'Quick Captured Research Note',
      moduleId: moduleId || state.activeModuleId,
      templateType: 'General Investigation',
      tags: [tag, 'Quick-Capture'],
      observation: hypothesisOrNote.trim(),
      hypothesisStatement:
        hypothesisOrNote.trim().length >= 12
          ? hypothesisOrNote.trim()
          : `Hypothesis for ${title.trim()}: testing boundary enforcement`,
      invariantTested: 'Pending formal invariant mapping',
      verdict: 'Unverified',
      experiments: [],
      evidenceRecords: [],
      counterEvidenceNotes: '',
      rootCauseConclusion: '',
      markdownNotes: `Captured as **${tag}** on ${now}.`,
      changeHistory: [{ timestamp: now, summary: `Quick Capture (${tag})` }],
      updatedAt: now,
    };
    updateState((prev) => ({
      ...prev,
      notebookInvestigations: [newInv, ...prev.notebookInvestigations],
    }));
  };

  const addApiInventoryItems = (items: ApiEndpointInventoryItem[]) => {
    updateState((prev) => ({
      ...prev,
      apiInventory: [...items, ...prev.apiInventory],
    }));
  };

  const updateApiInventoryStatus: AcademyContextValue['updateApiInventoryStatus'] = (
    id,
    observedResult,
    confidence,
    evidenceRef
  ) => {
    updateState((prev) => ({
      ...prev,
      apiInventory: prev.apiInventory.map((item) =>
        item.id === id ? { ...item, observedResult, confidence, evidenceRef } : item
      ),
    }));
  };

  const saveExploitChain = (chain: ExploitChainModel) => {
    updateState((prev) => {
      const exists = prev.exploitChains.some((c) => c.id === chain.id);
      return {
        ...prev,
        exploitChains: exists
          ? prev.exploitChains.map((c) => (c.id === chain.id ? chain : c))
          : [chain, ...prev.exploitChains],
      };
    });
  };

  const saveReportDraft = (report: VulnerabilityReportDraft) => {
    updateState((prev) => {
      const exists = prev.reports.some((r) => r.id === report.id);
      const nextSkills = { ...prev.skillScores };
      nextSkills.reportQuality = Math.min(100, nextSkills.reportQuality + 3);
      return {
        ...prev,
        skillScores: nextSkills,
        reports: exists
          ? prev.reports.map((r) => (r.id === report.id ? report : r))
          : [report, ...prev.reports],
      };
    });
  };

  const importValidatedState = (partial: Partial<LearnerState>) => {
    updateState((prev) => ({
      ...prev,
      ...partial,
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }));
  };

  const resetAllProgress = () => {
    const fresh = createDefaultLearnerState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    setLoaded({ state: fresh, recoveryNotice: null });
  };

  return (
    <AcademyContext.Provider
      value={{
        state,
        recoveryNotice,
        dismissRecoveryNotice: () =>
          setLoaded((prev) => ({ ...prev, recoveryNotice: null })),
        navigate,
        toggleTheme,
        toggleReadingMode,
        setGoalTrack,
        setDailyTargetMinutes,
        markLessonReadingCompleted,
        recordLessonAssessmentPassed,
        toggleSkipPrerequisiteOverride,
        addLessonAnnotation,
        deleteLessonAnnotation,
        submitLabAttempt,
        resetLabAttempt,
        commitCaseStudyStepHypothesis,
        saveCaseStudyConclusion,
        resetCaseStudyAttempt,
        recordFlashcardReview,
        toggleFlashcardFlag,
        createInvestigation,
        updateInvestigationVerdict,
        addEvidenceToInvestigation,
        addExperimentToInvestigation,
        deleteInvestigation,
        quickCaptureObservation,
        addApiInventoryItems,
        updateApiInventoryStatus,
        saveExploitChain,
        saveReportDraft,
        importValidatedState,
        resetAllProgress,
        curriculumStructure,
        isIndexedDbReady,
        indexedDbStatus,
        updateCurriculumModule,
        reloadCurriculumFromIndexedDb,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};

export function useAcademy(): AcademyContextValue {
  const ctx = useContext(AcademyContext);
  if (!ctx) {
    throw new Error('useAcademy must be used inside AcademyProvider');
  }
  return ctx;
}
