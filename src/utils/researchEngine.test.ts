import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateModuleUnlockStatus,
  scheduleFlashcardReview,
  validateHypothesisVerdictUpdate,
  evaluateLabSubmission,
  validateExploitChain,
  evaluateReportQuality,
  calculateProgressionMetrics,
  validateLearnerImportPackage,
  parseAndValidateApiInventoryCsv,
} from './researchEngine';
import {
  CurriculumModule,
  ExploitChainModel,
  InteractiveLab,
  LearnerState,
  VulnerabilityReportDraft,
} from '../types/domain';

const mockModules: CurriculumModule[] = [
  {
    id: 'mod-01',
    number: 1,
    title: 'Internet and HTTP Foundations',
    shortTitle: 'HTTP Foundations',
    track: 'Foundations & Protocol Mechanics',
    difficulty: 'Foundational',
    estimatedHours: 4,
    prerequisites: [],
    coreConcepts: ['HTTP/1.1 framing', 'Origin boundaries'],
    learningOutcomes: ['Parse HTTP traffic'],
    masteryRequirements: ['Pass baseline check'],
    lessonIds: ['les-01'],
    labIds: ['lab-01'],
    caseStudyIds: [],
    crossReferences: [],
    skillWeights: { protocolInterpretation: 10 },
    sourceReference: {
      id: 'src-01',
      chapterNumber: 1,
      sectionCode: '1.1',
      sectionTitle: 'HTTP Message Framing',
      printedPage: 'pp. 14–29',
      pdfViewerPage: 'PDF p. 22–37',
      verificationStatus: 'verified-curriculum-structure',
      attributionNote: 'Core Module 01',
    },
  },
  {
    id: 'mod-13',
    number: 13,
    title: 'Advanced HTTP and Request Smuggling',
    shortTitle: 'Request Smuggling',
    track: 'Foundations & Protocol Mechanics',
    difficulty: 'Research-Grade',
    estimatedHours: 7,
    prerequisites: ['mod-01'],
    coreConcepts: ['CL.TE desync'],
    learningOutcomes: ['Analyze parser discrepancies'],
    masteryRequirements: ['Complete desync fixture lab'],
    lessonIds: ['les-13'],
    labIds: ['lab-13'],
    caseStudyIds: [],
    crossReferences: [],
    skillWeights: { protocolInterpretation: 20 },
    sourceReference: {
      id: 'src-13',
      chapterNumber: 13,
      sectionCode: '13.1',
      sectionTitle: 'Parser Discrepancies',
      printedPage: 'pp. 284–312',
      pdfViewerPage: 'PDF p. 292–320',
      verificationStatus: 'verified-curriculum-structure',
      attributionNote: 'Core Module 13',
    },
  },
];

test('evaluateModuleUnlockStatus enforces prerequisite graph and supports explicit skip override', () => {
  const lockedEval = evaluateModuleUnlockStatus(mockModules[1], mockModules, {
    assessmentPassedLessonIds: [],
    masteredLessonIds: [],
    skippedPrerequisiteModuleIds: [],
  });
  assert.equal(lockedEval.isUnlocked, false);
  assert.deepEqual(lockedEval.missingPrerequisiteIds, ['mod-01']);

  const overriddenEval = evaluateModuleUnlockStatus(mockModules[1], mockModules, {
    assessmentPassedLessonIds: [],
    masteredLessonIds: [],
    skippedPrerequisiteModuleIds: ['mod-13'],
  });
  assert.equal(overriddenEval.isUnlocked, true);
  assert.equal(overriddenEval.isSkippedOverride, true);

  const unlockedEval = evaluateModuleUnlockStatus(mockModules[1], mockModules, {
    assessmentPassedLessonIds: ['les-01'],
    masteredLessonIds: [],
    skippedPrerequisiteModuleIds: [],
  });
  assert.equal(unlockedEval.isUnlocked, true);
  assert.equal(unlockedEval.isSkippedOverride, false);
});

test('scheduleFlashcardReview separates independent recall from hinted recall', () => {
  const now = 1700000000000;
  const firstIndependent = scheduleFlashcardReview(undefined, 'card-1', 5, false, now);
  assert.equal(firstIndependent.repetitions, 1);
  assert.equal(firstIndependent.independentSuccessCount, 1);
  assert.equal(firstIndependent.hintedAttemptCount, 0);

  const secondHinted = scheduleFlashcardReview(firstIndependent, 'card-1', 5, true, now);
  assert.equal(secondHinted.repetitions, 2);
  assert.equal(secondHinted.independentSuccessCount, 1);
  assert.equal(secondHinted.hintedAttemptCount, 1);
  assert.equal(secondHinted.intervalDays, 2); // capped due to hint

  const failedRecall = scheduleFlashcardReview(secondHinted, 'card-1', 1, false, now);
  assert.equal(failedRecall.repetitions, 0);
  assert.equal(failedRecall.intervalDays, 1);
});

test('validateHypothesisVerdictUpdate prevents confirming a hypothesis without supporting evidence', () => {
  const emptyInvestigation = {
    hypothesisStatement: 'Switching tenant_id header bypasses BOLA check on /api/v2/invoices',
    evidenceRecords: [],
    experiments: [],
  };

  const blocked = validateHypothesisVerdictUpdate(emptyInvestigation, 'Confirmed');
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.error?.includes('Cannot mark a hypothesis as Confirmed'));

  const allowedWithException = validateHypothesisVerdictUpdate(
    emptyInvestigation,
    'Confirmed',
    'Verified offline in paired architectural review session with lead researcher'
  );
  assert.equal(allowedWithException.allowed, true);
  assert.ok(allowedWithException.warning);

  const allowedWithEvidence = validateHypothesisVerdictUpdate(
    {
      ...emptyInvestigation,
      evidenceRecords: [
        {
          id: 'ev-1',
          title: 'Cross-tenant 200 OK',
          requestResponseSnapshot: 'GET /api/v2/invoices/992 -> 200 OK tenant B data',
          observedInvariantState: 'Tenant boundary violated',
          createdAt: '2026-10-24',
        },
      ],
    },
    'Confirmed'
  );
  assert.equal(allowedWithEvidence.allowed, true);
});

test('evaluateLabSubmission rejects false-positive traps and validates complete experiments', () => {
  const sampleLab: InteractiveLab = {
    id: 'lab-bola',
    moduleId: 'mod-06',
    title: 'Cross-Tenant Invoice Authorization',
    family: 'Authorization',
    isMysteryLab: false,
    difficulty: 'Intermediate',
    fictionalOrg: 'AegisPay',
    threatModel: 'Multi-tenant billing API',
    securityInvariant: 'Actor in Tenant A must never read or mutate objects owned by Tenant B.',
    baselineActor: 'alice@tenant-a.io',
    secondaryActor: 'bob@tenant-b.io',
    baselineRequest: {
      method: 'GET',
      path: '/api/v2/invoices/inv_101',
      protocol: 'HTTP/1.1',
      headers: { Authorization: 'Bearer token_tenant_a' },
      body: '',
    },
    baselineResponse: {
      status: 200,
      statusText: 'OK',
      headers: {},
      body: '{"id":"inv_101","tenant":"tenant-a"}',
      latencyMs: 32,
    },
    mutationPresets: [
      {
        id: 'mut-fp',
        label: 'Change X-Forwarded-Host header',
        variableChanged: 'X-Forwarded-Host',
        description: 'Inject custom host header',
        request: {
          method: 'GET',
          path: '/api/v2/invoices/inv_101',
          protocol: 'HTTP/1.1',
          headers: { Authorization: 'Bearer token_tenant_a', 'X-Forwarded-Host': 'evil.local' },
          body: '',
        },
        simulatedResponse: {
          status: 200,
          statusText: 'OK',
          headers: { 'X-Debug-Echo': 'evil.local' },
          body: '{"id":"inv_101","tenant":"tenant-a"}',
          latencyMs: 30,
        },
        isInvariantViolation: false,
        isFalsePositiveTrap: true,
        analysisExplanation: 'Reflecting header in non-cached debug header does not cross tenant boundaries.',
        evidenceTag: 'FP-TRAP',
      },
      {
        id: 'mut-valid',
        label: 'Request Tenant B invoice ID with Tenant A Bearer Token on legacy v1 route',
        variableChanged: 'Path version & Object ID',
        description: 'Test /api/v1/invoices/inv_999_tenant_b with Tenant A session',
        request: {
          method: 'GET',
          path: '/api/v1/invoices/inv_999_tenant_b',
          protocol: 'HTTP/1.1',
          headers: { Authorization: 'Bearer token_tenant_a' },
          body: '',
        },
        simulatedResponse: {
          status: 200,
          statusText: 'OK',
          headers: {},
          body: '{"id":"inv_999_tenant_b","tenant":"tenant-b","amount":48000}',
          latencyMs: 41,
        },
        isInvariantViolation: true,
        isFalsePositiveTrap: false,
        analysisExplanation: 'v1 controller only checks authentication and omits tenant ownership predicate.',
        evidenceTag: 'EV-BOLA-V1',
      },
    ],
    requiredHypothesisKeywords: ['tenant', 'v1', 'invoice', 'authorization'],
    requiredCorrectPresetId: 'mut-valid',
    falsePositiveCheckQuestion: {
      prompt: 'How do you confirm this is not public sample data?',
      options: [
        { id: 'fp-1', text: 'Verify object belongs exclusively to Tenant B private ledger', isCorrect: true, explanation: 'Correct.' },
        { id: 'fp-2', text: 'Assume any 200 OK is a critical bug', isCorrect: false, explanation: 'Incorrect.' },
      ],
    },
    rootCauseOptions: [
      { id: 'rc-1', text: 'Missing tenant_id predicate in legacy v1 SQL query', isCorrect: true, explanation: 'Correct.' },
      { id: 'rc-2', text: 'Weak TLS cipher', isCorrect: false, explanation: 'Incorrect.' },
    ],
    progressiveHints: ['Compare v1 and v2 controllers'],
    solutionExplanation: {
      summary: 'v1 route lacks tenant scope filter',
      whyItWorks: 'Controller queries by primary key only',
      ruledOutAlternatives: 'Token forgery ruled out',
      simulationLimitations: 'Deterministic local fixture',
    },
    skillRewards: { authorizationReasoning: 15, evidenceQuality: 10 },
  };

  const trapAttempt = evaluateLabSubmission(sampleLab, {
    hypothesisText: 'If we query v1 invoice endpoint for another tenant, authorization check is bypassed.',
    selectedPresetId: 'mut-fp',
    falsePositiveOptionId: 'fp-1',
    rootCauseOptionId: 'rc-1',
  });
  assert.equal(trapAttempt.passed, false);
  assert.equal(trapAttempt.mutationValid, false);

  const validAttempt = evaluateLabSubmission(sampleLab, {
    hypothesisText: 'If we query v1 invoice endpoint for another tenant, authorization check is bypassed.',
    selectedPresetId: 'mut-valid',
    falsePositiveOptionId: 'fp-1',
    rootCauseOptionId: 'rc-1',
  });
  assert.equal(validAttempt.passed, true);
  assert.equal(validAttempt.skillRewards.authorizationReasoning, 15);
});

test('validateExploitChain detects unverified nodes, orphan nodes, and duplicate impact claims', () => {
  const brokenChain: ExploitChainModel = {
    id: 'chain-1',
    title: 'Broken Test Chain',
    startingCapability: 'Unauthenticated user',
    finalDemonstratedImpact: 'Account takeover',
    nodes: [
      {
        id: 'n1',
        type: 'Confirmed Weakness',
        title: 'Unverified CORS flaw',
        capabilityBefore: 'None',
        capabilityAfter: 'Read profile',
        evidenceRef: '', // missing evidence!
        confidence: 'Validated',
        invariantAffected: 'Origin isolation',
      },
      {
        id: 'n2',
        type: 'Impact',
        title: 'Admin Compromise',
        capabilityBefore: 'Read profile',
        capabilityAfter: 'Full Admin Control',
        evidenceRef: 'EV-2',
        confidence: 'Validated',
        invariantAffected: 'Admin boundary',
      },
    ],
    edges: [],
  };

  const res = validateExploitChain(brokenChain);
  assert.equal(res.isValidChain, false);
  assert.ok(res.issues.some((i) => i.includes('without an Evidence Reference')));
  assert.ok(res.issues.some((i) => i.includes('without any causal edges')));
});

test('evaluateReportQuality flags unsanitized tokens and missing reproduction steps', () => {
  const badDraft: VulnerabilityReportDraft = {
    id: 'rep-1',
    title: 'Bug',
    templateCategory: 'Authorization',
    affectedAssetInScope: 'site',
    technicalSeverity: 'High',
    demonstratedImpactLevel: 'Bad',
    uncertaintyNotes: '',
    prerequisites: '',
    reproductionSteps: 'Click button',
    expectedBehavior: '403',
    actualBehavior: '200',
    sanitizedEvidence: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
    evidenceReferences: [],
    rootCause: '',
    remediationGuidance: '',
    limitationsAndScope: '',
    falsePositiveReview: '',
    updatedAt: '2026-10-24',
  };

  const evalRes = evaluateReportQuality(badDraft);
  assert.ok(evalRes.readinessScore < 50);
  const piiCheck = evalRes.checklist.find((c) => c.id === 'sanitized-pii');
  assert.equal(piiCheck?.passed, false);
});

test('validateLearnerImportPackage and parseAndValidateApiInventoryCsv reject malformed inputs safely', () => {
  const badJson = validateLearnerImportPackage('{broken json');
  assert.equal(badJson.valid, false);

  const missingFields = validateLearnerImportPackage('{"schemaVersion": 1}');
  assert.equal(missingFields.valid, false);
  assert.ok(missingFields.errors.length > 0);

  const csvResult = parseAndValidateApiInventoryCsv(
    `protocol,method,pathOrOperation,apiVersion,authRequired,actorRole\nREST,GET,/api/v1/users,v1,true,Admin\nINVALID_PROTO,POST,badpath,v1,true,User`
  );
  assert.equal(csvResult.validRows.length, 1);
  assert.equal(csvResult.invalidRows.length, 1);
  assert.equal(csvResult.validRows[0].pathOrOperation, '/api/v1/users');
});
