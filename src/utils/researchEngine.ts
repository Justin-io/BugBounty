import {
  ApiEndpointInventoryItem,
  CurriculumModule,
  ExploitChainModel,
  FlashcardReviewState,
  HypothesisVerdict,
  InteractiveLab,
  LearnerState,
  NotebookInvestigation,
  ProgressionStage,
  SkillDimension,
  VulnerabilityReportDraft,
} from '../types/domain';

export interface UnlockEvaluation {
  moduleId: string;
  isUnlocked: boolean;
  isSkippedOverride: boolean;
  missingPrerequisiteIds: string[];
  dependentModuleIds: string[];
}

/**
 * Evaluates prerequisite graph unlock status for a module.
 */
export function evaluateModuleUnlockStatus(
  targetModule: CurriculumModule,
  allModules: CurriculumModule[],
  state: Pick<
    LearnerState,
    'assessmentPassedLessonIds' | 'masteredLessonIds' | 'skippedPrerequisiteModuleIds'
  >
): UnlockEvaluation {
  const completedSet = new Set([
    ...state.assessmentPassedLessonIds,
    ...state.masteredLessonIds,
  ]);

  const missingPrerequisiteIds: string[] = [];
  for (const prereqModId of targetModule.prerequisites) {
    const prereqMod = allModules.find((m) => m.id === prereqModId);
    if (!prereqMod) continue;
    const hasCompletedLesson = prereqMod.lessonIds.some((lid) => completedSet.has(lid));
    if (!hasCompletedLesson) {
      missingPrerequisiteIds.push(prereqModId);
    }
  }

  const isSkippedOverride = state.skippedPrerequisiteModuleIds.includes(targetModule.id);
  const isUnlocked = missingPrerequisiteIds.length === 0 || isSkippedOverride;

  const dependentModuleIds = allModules
    .filter((m) => m.prerequisites.includes(targetModule.id))
    .map((m) => m.id);

  return {
    moduleId: targetModule.id,
    isUnlocked,
    isSkippedOverride: missingPrerequisiteIds.length > 0 && isSkippedOverride,
    missingPrerequisiteIds,
    dependentModuleIds,
  };
}

/**
 * Deterministic SM-2 inspired spaced-repetition scheduler.
 * Tracks independent recall separately from hinted recall.
 */
export function scheduleFlashcardReview(
  previous: FlashcardReviewState | undefined,
  cardId: string,
  confidence: 1 | 2 | 3 | 4 | 5,
  usedHint: boolean,
  nowMs: number
): FlashcardReviewState {
  const prevInterval = previous?.intervalDays ?? 0;
  const prevEase = previous?.easeFactor ?? 2.5;
  const prevReps = previous?.repetitions ?? 0;
  const prevIndependent = previous?.independentSuccessCount ?? 0;
  const prevHinted = previous?.hintedAttemptCount ?? 0;

  // If a hint was used, cap effective quality at 3 so interval does not jump rapidly
  const effectiveQuality = usedHint ? Math.min(confidence, 3) : confidence;

  let nextIntervalDays = 1;
  let nextReps = prevReps;
  let nextEase = prevEase;

  if (effectiveQuality < 3) {
    nextReps = 0;
    nextIntervalDays = 1;
    nextEase = Math.max(1.3, prevEase - 0.2);
  } else {
    nextReps = prevReps + 1;
    if (nextReps === 1) {
      nextIntervalDays = 1;
    } else if (nextReps === 2) {
      nextIntervalDays = usedHint ? 2 : 3;
    } else {
      const multiplier = usedHint ? Math.min(1.5, prevEase * 0.75) : prevEase;
      nextIntervalDays = Math.max(2, Math.round(prevInterval * multiplier));
    }
    const easeDelta =
      0.1 - (5 - effectiveQuality) * (0.08 + (5 - effectiveQuality) * 0.02);
    nextEase = Math.max(1.3, Math.min(3.0, Number((prevEase + easeDelta).toFixed(2))));
  }

  const dayMs = 24 * 60 * 60 * 1000;
  return {
    cardId,
    intervalDays: nextIntervalDays,
    easeFactor: nextEase,
    repetitions: nextReps,
    dueTimestamp: nowMs + nextIntervalDays * dayMs,
    lastConfidence: confidence,
    independentSuccessCount:
      !usedHint && confidence >= 4 ? prevIndependent + 1 : prevIndependent,
    hintedAttemptCount: usedHint ? prevHinted + 1 : prevHinted,
    flaggedForReview: previous?.flaggedForReview ?? false,
    lastReviewedAt: nowMs,
  };
}

/**
 * Enforces evidence requirement before confirming a hypothesis in the Research Notebook.
 */
export function validateHypothesisVerdictUpdate(
  investigation: Pick<
    NotebookInvestigation,
    'hypothesisStatement' | 'evidenceRecords' | 'experiments'
  >,
  targetVerdict: HypothesisVerdict,
  exceptionRationale?: string
): { allowed: boolean; error?: string; warning?: string } {
  if (!investigation.hypothesisStatement || investigation.hypothesisStatement.trim().length < 10) {
    return {
      allowed: false,
      error: 'A testable hypothesis statement (at least 10 characters) is required before assigning a verdict.',
    };
  }

  if (targetVerdict === 'Confirmed') {
    const hasEvidence = investigation.evidenceRecords.length > 0;
    const hasConfirmedExperiment = investigation.experiments.some(
      (exp) => exp.verdict === 'Confirmed' && exp.actualResult.trim().length > 0
    );

    if (!hasEvidence && !hasConfirmedExperiment) {
      if (exceptionRationale && exceptionRationale.trim().length >= 15) {
        return {
          allowed: true,
          warning:
            'Hypothesis marked Confirmed via explicit exception rationale without linked evidence packet.',
        };
      }
      return {
        allowed: false,
        error:
          'Cannot mark a hypothesis as Confirmed without at least one supporting Evidence Record or validated Experiment. Provide supporting evidence or record an explicit exception rationale (15+ chars).',
      };
    }
  }

  return { allowed: true };
}

export interface LabEvaluationResult {
  passed: boolean;
  hypothesisValid: boolean;
  mutationValid: boolean;
  falsePositiveHandled: boolean;
  rootCauseValid: boolean;
  feedback: string[];
  skillRewards: Partial<Record<SkillDimension, number>>;
}

/**
 * Evaluates a learner's controlled experiment submission in an Interactive Lab.
 */
export function evaluateLabSubmission(
  lab: InteractiveLab,
  submission: {
    hypothesisText: string;
    selectedPresetId: string;
    falsePositiveOptionId: string;
    rootCauseOptionId: string;
  }
): LabEvaluationResult {
  const feedback: string[] = [];
  const normalizedHyp = submission.hypothesisText.trim().toLowerCase();

  const matchesKeyword =
    lab.requiredHypothesisKeywords.length === 0 ||
    lab.requiredHypothesisKeywords.some((kw) => normalizedHyp.includes(kw.toLowerCase()));

  const hypothesisValid = normalizedHyp.length >= 20 && matchesKeyword;
  if (!hypothesisValid) {
    feedback.push(
      `Hypothesis requires a specific testable claim referencing the target mechanism or invariant (e.g., ${lab.requiredHypothesisKeywords.slice(0, 3).join(', ')}).`
    );
  }

  const chosenPreset = lab.mutationPresets.find((p) => p.id === submission.selectedPresetId);
  let mutationValid = false;
  if (!chosenPreset) {
    feedback.push('Select and run a controlled mutation before submitting validation.');
  } else if (chosenPreset.isFalsePositiveTrap) {
    feedback.push(
      `False-Positive Trap Selected: "${chosenPreset.label}" — ${chosenPreset.analysisExplanation}`
    );
  } else if (!chosenPreset.isInvariantViolation) {
    feedback.push(
      `Baseline or Safe Control Selected: "${chosenPreset.label}" did not violate the security invariant (${lab.securityInvariant}).`
    );
  } else {
    mutationValid = true;
  }

  const fpOption = lab.falsePositiveCheckQuestion.options.find(
    (o) => o.id === submission.falsePositiveOptionId
  );
  const falsePositiveHandled = Boolean(fpOption?.isCorrect);
  if (!falsePositiveHandled) {
    feedback.push(
      fpOption
        ? `False-Positive Check Failed: ${fpOption.explanation}`
        : 'Complete the false-positive verification check.'
    );
  }

  const rcOption = lab.rootCauseOptions.find((o) => o.id === submission.rootCauseOptionId);
  const rootCauseValid = Boolean(rcOption?.isCorrect);
  if (!rootCauseValid) {
    feedback.push(
      rcOption
        ? `Root-Cause Interpretation Incorrect: ${rcOption.explanation}`
        : 'Select the underlying root-cause mechanism.'
    );
  }

  const passed =
    hypothesisValid && mutationValid && falsePositiveHandled && rootCauseValid;

  if (passed) {
    feedback.push(
      'Investigation Validated: Controlled mutation isolated the independent variable, ruled out false positives, and confirmed the invariant violation.'
    );
  }

  return {
    passed,
    hypothesisValid,
    mutationValid,
    falsePositiveHandled,
    rootCauseValid,
    feedback,
    skillRewards: passed ? lab.skillRewards : {},
  };
}

export interface ChainValidationResult {
  isValidChain: boolean;
  issues: string[];
  validatedTransitionCount: number;
  speculativeTransitionCount: number;
}

/**
 * Validates an Exploit Chain for causal integrity, evidence backing, and duplicate impacts.
 */
export function validateExploitChain(chain: ExploitChainModel): ChainValidationResult {
  const issues: string[] = [];

  if (chain.nodes.length < 2) {
    issues.push('An exploit chain requires at least 2 linked nodes (starting capability to impact).');
  }

  const hasPrecondition = chain.nodes.some(
    (n) => n.type === 'Precondition' || n.type === 'Observation'
  );
  if (!hasPrecondition) {
    issues.push('Missing starting Precondition or Baseline Observation node.');
  }

  const hasImpact = chain.nodes.some((n) => n.type === 'Impact');
  if (!hasImpact) {
    issues.push('Missing terminal Impact node defining resulting attacker capability.');
  }

  // Check that Confirmed Weakness nodes have an evidence reference
  for (const node of chain.nodes) {
    if (node.type === 'Confirmed Weakness' && (!node.evidenceRef || node.evidenceRef.trim().length < 3)) {
      issues.push(
        `Node "${node.title}" is marked as a Confirmed Weakness without an Evidence Reference.`
      );
    }
    if (node.confidence === 'Speculative' && node.type === 'Confirmed Weakness') {
      issues.push(
        `Node "${node.title}" cannot be labeled "Confirmed Weakness" while confidence is Speculative.`
      );
    }
  }

  // Check duplicate impact claims
  const impactNodes = chain.nodes.filter((n) => n.type === 'Impact');
  const seenCapabilities = new Set<string>();
  for (const imp of impactNodes) {
    const norm = imp.capabilityAfter.trim().toLowerCase();
    if (norm && seenCapabilities.has(norm)) {
      issues.push(`Duplicated impact capability claim detected: "${imp.capabilityAfter}".`);
    }
    seenCapabilities.add(norm);
  }

  // Check causal edges
  const nodeIds = new Set(chain.nodes.map((n) => n.id));
  const connectedIds = new Set<string>();
  let validatedTransitionCount = 0;
  let speculativeTransitionCount = 0;

  for (const edge of chain.edges) {
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) {
      issues.push(`Edge "${edge.id}" references a non-existent node.`);
      continue;
    }
    connectedIds.add(edge.fromNodeId);
    connectedIds.add(edge.toNodeId);
    if (!edge.causalJustification || edge.causalJustification.trim().length < 8) {
      issues.push('Every causal edge must explain how the output capability satisfies the next precondition.');
    }
    if (edge.isValidatedLink) {
      validatedTransitionCount++;
    } else {
      speculativeTransitionCount++;
    }
  }

  if (chain.nodes.length >= 2 && chain.edges.length === 0) {
    issues.push('Nodes exist on the canvas without any causal edges linking them.');
  } else {
    for (const node of chain.nodes) {
      if (chain.nodes.length > 1 && !connectedIds.has(node.id)) {
        issues.push(`Unlinked orphan node detected: "${node.title}" is not connected to the causal chain.`);
      }
    }
  }

  return {
    isValidChain: issues.length === 0 && speculativeTransitionCount === 0,
    issues,
    validatedTransitionCount,
    speculativeTransitionCount,
  };
}

export interface ReportQualityResult {
  readinessScore: number;
  checklist: {
    id: string;
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

/**
 * Evaluates a vulnerability report draft against triage proof-obligation standards.
 */
export function evaluateReportQuality(report: VulnerabilityReportDraft): ReportQualityResult {
  const hasSpecificAsset =
    report.affectedAssetInScope.trim().length >= 8 &&
    !['example.com', 'site', 'website', 'app', 'target'].includes(
      report.affectedAssetInScope.trim().toLowerCase()
    );

  const hasReproSteps =
    report.reproductionSteps.trim().length >= 40 &&
    (report.reproductionSteps.includes('1.') || report.reproductionSteps.includes('Step'));

  const hasExpectedVsActual =
    report.expectedBehavior.trim().length >= 15 &&
    report.actualBehavior.trim().length >= 15 &&
    report.expectedBehavior.trim() !== report.actualBehavior.trim();

  const hasEvidenceRef =
    report.sanitizedEvidence.trim().length >= 20 &&
    report.evidenceReferences.length > 0;

  // Detect unsanitized secrets or raw bearer tokens / emails that aren't redacted
  const unsanitizedPattern = /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+|AKIA[0-9A-Z]{16}/;
  const isSanitized =
    report.sanitizedEvidence.trim().length > 0 &&
    !unsanitizedPattern.test(report.sanitizedEvidence);

  const hasSupportedImpact =
    report.demonstratedImpactLevel.trim().length >= 20 &&
    report.limitationsAndScope.trim().length >= 10;

  const hasFalsePositiveReview = report.falsePositiveReview.trim().length >= 15;

  const checklist = [
    {
      id: 'asset-scope',
      label: 'Specific Authorised Asset & Endpoint Scope',
      passed: hasSpecificAsset,
      detail: hasSpecificAsset
        ? 'Affected asset specifies concrete host/endpoint in scope.'
        : 'Specify the exact endpoint, service, or component rather than a vague asset name.',
    },
    {
      id: 'repro-steps',
      label: 'Numbered, Deterministic Reproduction Steps',
      passed: hasReproSteps,
      detail: hasReproSteps
        ? 'Reproduction steps are numbered and detailed.'
        : 'Provide numbered steps (1., 2., ...) with concrete preconditions and actors.',
    },
    {
      id: 'expected-actual',
      label: 'Explicit Security Invariant (Expected vs. Actual Behavior)',
      passed: hasExpectedVsActual,
      detail: hasExpectedVsActual
        ? 'Clearly contrasts expected security boundary with observed behavior.'
        : 'Document both expected invariant enforcement and actual observed response.',
    },
    {
      id: 'evidence-backed',
      label: 'Linked Evidence References & Request/Response Proof',
      passed: hasEvidenceRef,
      detail: hasEvidenceRef
        ? `${report.evidenceReferences.length} evidence reference(s) attached.`
        : 'Attach at least one evidence ID and include request/response artifacts.',
    },
    {
      id: 'sanitized-pii',
      label: 'Credential & PII Sanitization Check',
      passed: isSanitized,
      detail: isSanitized
        ? 'No raw live JWTs or unredacted cloud keys detected in evidence.'
        : 'Sanitize live JWTs, session secrets, or cloud keys (replace with [REDACTED]) before export.',
    },
    {
      id: 'impact-limitations',
      label: 'Justified Impact & Explicit Scope Limitations',
      passed: hasSupportedImpact,
      detail: hasSupportedImpact
        ? 'Distinguishes demonstrated capability from speculative scope.'
        : 'Explain both demonstrated impact and boundaries/limitations of your proof.',
    },
    {
      id: 'fp-check',
      label: 'False-Positive & Benign-Behavior Exclusion',
      passed: hasFalsePositiveReview,
      detail: hasFalsePositiveReview
        ? 'Alternative benign explanations explicitly ruled out.'
        : 'Document how you verified the response is not an intended feature or mock cache hit.',
    },
  ];

  const passedCount = checklist.filter((c) => c.passed).length;
  const readinessScore = Math.round((passedCount / checklist.length) * 100);

  return { readinessScore, checklist };
}

/**
 * Computes learner progression stage and skill averages from real demonstrated state.
 */
export function calculateProgressionMetrics(state: LearnerState): {
  stage: ProgressionStage;
  overallSkillScore: number;
  masteredCount: number;
  passedAssessmentCount: number;
  readingOnlyCount: number;
  validatedLabsCount: number;
  confirmedHypothesesCount: number;
  nextStageRequirement: string;
} {
  const skillValues = Object.values(state.skillScores);
  const overallSkillScore =
    skillValues.length > 0
      ? Math.round(skillValues.reduce((a, b) => a + b, 0) / skillValues.length)
      : 0;

  const masteredCount = state.masteredLessonIds.length;
  const passedAssessmentCount = state.assessmentPassedLessonIds.length;
  const readingOnlyCount = state.readingCompletedLessonIds.filter(
    (id) => !state.assessmentPassedLessonIds.includes(id)
  ).length;

  const validatedLabsCount = Object.values(state.labAttempts).filter(
    (a) => a.completed && !a.solutionViewed
  ).length;

  const confirmedHypothesesCount = state.notebookInvestigations.filter(
    (inv) => inv.verdict === 'Confirmed' && inv.evidenceRecords.length > 0
  ).length;

  let stage: ProgressionStage = 'Beginner';
  let nextStageRequirement =
    'Pass 2 lesson assessments and validate 1 controlled lab experiment to reach Competent.';

  if (
    masteredCount >= 12 &&
    validatedLabsCount >= 6 &&
    confirmedHypothesesCount >= 4 &&
    overallSkillScore >= 80
  ) {
    stage = 'Independent Researcher';
    nextStageRequirement =
      'Highest research tier achieved. Continue authoring original exploit chains and triage-grade reports.';
  } else if (
    masteredCount >= 8 &&
    validatedLabsCount >= 4 &&
    confirmedHypothesesCount >= 3 &&
    overallSkillScore >= 65
  ) {
    stage = 'Specialist';
    nextStageRequirement =
      'Master 12+ lessons, validate 6+ labs independently, and maintain 80%+ skill average for Independent Researcher.';
  } else if (
    masteredCount >= 5 &&
    validatedLabsCount >= 3 &&
    confirmedHypothesesCount >= 2 &&
    overallSkillScore >= 50
  ) {
    stage = 'Advanced';
    nextStageRequirement =
      'Master 8+ lessons, validate 4+ labs, and confirm 3+ evidence-backed notebook hypotheses for Specialist.';
  } else if (
    masteredCount >= 3 &&
    validatedLabsCount >= 2 &&
    confirmedHypothesesCount >= 1
  ) {
    stage = 'Intermediate';
    nextStageRequirement =
      'Master 5+ lessons, validate 3+ labs, and reach 50%+ skill average for Advanced.';
  } else if (passedAssessmentCount >= 2 && validatedLabsCount >= 1) {
    stage = 'Competent';
    nextStageRequirement =
      'Achieve full mastery on 3 lessons, validate 2 labs, and confirm 1 notebook hypothesis for Intermediate.';
  }

  return {
    stage,
    overallSkillScore,
    masteredCount,
    passedAssessmentCount,
    readingOnlyCount,
    validatedLabsCount,
    confirmedHypothesesCount,
    nextStageRequirement,
  };
}

/**
 * Validates imported JSON learner state packages safely before applying.
 */
export function validateLearnerImportPackage(rawJson: string): {
  valid: boolean;
  parsedState?: Partial<LearnerState>;
  errors: string[];
  summary?: {
    lessonsCompleted: number;
    labsAttempted: number;
    investigationsCount: number;
    reportsCount: number;
  };
} {
  const errors: string[] = [];
  let data: unknown;
  try {
    data = JSON.parse(rawJson);
  } catch {
    return { valid: false, errors: ['Malformed JSON syntax: unable to parse import payload.'] };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Root JSON payload must be a LearnerState object.'] };
  }

  const candidate = data as Record<string, unknown>;
  if (typeof candidate.schemaVersion !== 'number' || candidate.schemaVersion < 1) {
    errors.push('Missing or invalid numerical schemaVersion field.');
  }
  if (!Array.isArray(candidate.readingCompletedLessonIds)) {
    errors.push('Field "readingCompletedLessonIds" must be an array of lesson ID strings.');
  }
  if (!Array.isArray(candidate.assessmentPassedLessonIds)) {
    errors.push('Field "assessmentPassedLessonIds" must be an array of lesson ID strings.');
  }
  if (!Array.isArray(candidate.notebookInvestigations)) {
    errors.push('Field "notebookInvestigations" must be an array.');
  }
  if (
    !candidate.skillScores ||
    typeof candidate.skillScores !== 'object' ||
    Array.isArray(candidate.skillScores)
  ) {
    errors.push('Field "skillScores" must be a valid skill map object.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const typed = candidate as unknown as LearnerState;
  return {
    valid: true,
    parsedState: typed,
    errors: [],
    summary: {
      lessonsCompleted: typed.assessmentPassedLessonIds.length,
      labsAttempted: Object.keys(typed.labAttempts || {}).length,
      investigationsCount: typed.notebookInvestigations.length,
      reportsCount: (typed.reports || []).length,
    },
  };
}

/**
 * Parses and validates CSV endpoint inventory imports for the API Security Workbench.
 * Expected columns: protocol,method,pathOrOperation,apiVersion,authRequired,actorRole,tenantScope,objectOwnershipRule,writableProperties,expectedPermission
 */
export function parseAndValidateApiInventoryCsv(csvText: string): {
  validRows: ApiEndpointInventoryItem[];
  invalidRows: { lineNumber: number; rawLine: string; reason: string }[];
} {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const validRows: ApiEndpointInventoryItem[] = [];
  const invalidRows: { lineNumber: number; rawLine: string; reason: string }[] = [];

  if (lines.length === 0) {
    return {
      validRows,
      invalidRows: [{ lineNumber: 1, rawLine: '', reason: 'CSV input is empty.' }],
    };
  }

  const startIndex = lines[0].toLowerCase().startsWith('protocol,') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(',').map((c) => c.trim());
    if (cols.length < 6) {
      invalidRows.push({
        lineNumber: i + 1,
        rawLine,
        reason: `Expected at least 6 comma-separated columns, found ${cols.length}.`,
      });
      continue;
    }

    const [
      protocolRaw,
      method,
      pathOrOperation,
      apiVersion,
      authReqRaw,
      actorRole,
      tenantScopeRaw = 'Single-Tenant',
      objectOwnershipRule = 'Owner match required',
      writablePropsRaw = '',
      expectedPermRaw = 'Deny',
    ] = cols;

    if (!['REST', 'GraphQL', 'WebSocket'].includes(protocolRaw)) {
      invalidRows.push({
        lineNumber: i + 1,
        rawLine,
        reason: `Invalid protocol "${protocolRaw}". Must be REST, GraphQL, or WebSocket.`,
      });
      continue;
    }

    if (!pathOrOperation.startsWith('/') && protocolRaw === 'REST') {
      invalidRows.push({
        lineNumber: i + 1,
        rawLine,
        reason: `REST endpoint path "${pathOrOperation}" must start with "/".`,
      });
      continue;
    }

    validRows.push({
      id: `imported-${Date.now()}-${i}`,
      protocol: protocolRaw as 'REST' | 'GraphQL' | 'WebSocket',
      method: method.toUpperCase() || 'GET',
      pathOrOperation,
      apiVersion: apiVersion || 'v1',
      authRequired: authReqRaw.toLowerCase() !== 'false',
      actorRole: actorRole || 'Member',
      tenantScope:
        tenantScopeRaw === 'Cross-Tenant-Test' || tenantScopeRaw === 'Global'
          ? tenantScopeRaw
          : 'Single-Tenant',
      objectOwnershipRule,
      writableProperties: writablePropsRaw
        ? writablePropsRaw.split(';').map((s) => s.trim()).filter(Boolean)
        : [],
      expectedPermission: expectedPermRaw === 'Allow' ? 'Allow' : 'Deny',
      observedResult: 'Untested',
      evidenceRef: '',
      confidence: 'Opportunity Only',
    });
  }

  return { validRows, invalidRows };
}
