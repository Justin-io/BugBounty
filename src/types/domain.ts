export type ResearchCycleStep =
  | 'STUDY'
  | 'MODEL'
  | 'BASELINE'
  | 'HYPOTHESIS'
  | 'CONTROLLED_MUTATION'
  | 'VALIDATION'
  | 'IMPACT'
  | 'CHAIN'
  | 'REPORT'
  | 'NEW_HYPOTHESIS';

export type ProgressionStage =
  | 'Beginner'
  | 'Competent'
  | 'Intermediate'
  | 'Advanced'
  | 'Specialist'
  | 'Independent Researcher';

export type SkillDimension =
  | 'conceptualUnderstanding'
  | 'protocolInterpretation'
  | 'experimentalDesign'
  | 'evidenceQuality'
  | 'authorizationReasoning'
  | 'falsePositiveRejection'
  | 'rootCauseExplanation'
  | 'impactAnalysis'
  | 'reportQuality';

export type SourceVerificationStatus =
  | 'verified-curriculum-structure'
  | 'reconstructed-reference-unit'
  | 'original-interactive-lab';

export interface SourceReference {
  id: string;
  chapterNumber: number;
  sectionCode: string;
  sectionTitle: string;
  printedPage: string;
  pdfViewerPage: string;
  verificationStatus: SourceVerificationStatus;
  attributionNote: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  category: 'actor' | 'boundary' | 'component' | 'datastore' | 'control' | 'sink';
  role: string;
  assumptions: string[];
  inputs: string[];
  outputs: string[];
  securityInvariant: string;
}

export interface DiagramStep {
  stepNumber: number;
  fromNodeId: string;
  toNodeId: string;
  protocolAction: string;
  payloadPreview: string;
  invariantCheck: string;
  failureCondition: string;
}

export interface InteractiveDiagramSpec {
  id: string;
  title: string;
  subtitle: string;
  nodes: DiagramNode[];
  steps: DiagramStep[];
}

export interface KnowledgeQuestion {
  id: string;
  questionType:
    | 'identify-the-invariant'
    | 'distinguish-false-positive'
    | 'select-next-experiment'
    | 'trace-root-cause'
    | 'interpret-response'
    | 'compare-two-requests';
  prompt: string;
  codeOrTrafficSnippet?: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  invariantTested: string;
}

export interface ControlledPracticeExercise {
  prompt: string;
  baselineObservation: string;
  candidateHypotheses: {
    id: string;
    statement: string;
    isTestableAndSound: boolean;
    feedback: string;
  }[];
  controlledExperimentPrompt: string;
  evidenceOptions: {
    id: string;
    observation: string;
    provesInvariantViolation: boolean;
    explanation: string;
  }[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  moduleNumber: number;
  orderInModule: number;
  title: string;
  stageBadge: 'CONCEPT' | 'PRACTICE' | 'CASE STUDY' | 'LAB' | 'RESEARCH DRILL';
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced' | 'Research-Grade';
  estimatedMinutes: number;
  prerequisites: string[]; // lesson IDs or module IDs
  learningObjective: string;
  whyItMatters: string;
  prerequisiteKnowledge: string[];
  coreMentalModel: string;
  technicalExplanation: string[];
  protocolDiagram: InteractiveDiagramSpec;
  workedExample: {
    title: string;
    scenario: string;
    baselineTraffic: string;
    mutatedTraffic: string;
    observedResponse: string;
    invariantViolated: string;
    reasoningWalkthrough: string;
  };
  commonMisconceptions: {
    misconception: string;
    reality: string;
  }[];
  failureModes: string[];
  falsePositiveChecks: {
    symptom: string;
    whyItIsFalsePositive: string;
    verificationTest: string;
  }[];
  controlledPractice: ControlledPracticeExercise;
  knowledgeCheck: KnowledgeQuestion[];
  researchDrill: {
    objective: string;
    hypothesisTemplate: string;
    experimentSteps: string[];
    evidenceRequired: string;
    disconfirmingEvidence: string;
  };
  beforeYouMoveOn: string[];
  furtherReading: string[];
  relatedLabId?: string;
  relatedCaseStudyId?: string;
  sourceReference: SourceReference;
}

export interface ModulePrerequisiteRelation {
  sourceModuleId: string;
  targetModuleId: string;
  relationType: 'hard-prerequisite' | 'recommended-prior' | 'cross-domain-bridge';
  rationale: string;
  targetSkillRequirement?: SkillDimension;
  minimumSkillScore?: number;
}

export interface LabRequirementDefinition {
  id: string;
  moduleId: string;
  title: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced' | 'Research-Grade';
  targetSecurityInvariant: string;
  primaryVulnerabilityClass: string;
  controlledMutationsCount: number;
  proofObligationDescription: string;
  minimumConfidenceScore: number;
  requiresFalsePositiveExclusion: boolean;
  expectedArtifactType:
    | 'http-differential'
    | 'source-sink-trace'
    | 'iam-policy-proof'
    | 'concurrency-race'
    | 'prompt-injection-trace';
}

export interface CveCaseStudy {
  cveId: string;
  title: string;
  affectedSystem: string;
  vulnerabilityClass: string;
  rootCauseInvariantBreak: string;
  mutationPayloadPreview: string;
  proofOfConceptObligation: string;
  defensiveRemediation: string;
}

export interface CurriculumModuleDefinition {
  id: string;
  number: number;
  title: string;
  shortTitle: string;
  track:
    | 'Foundations & Protocol Mechanics'
    | 'Identity, Access & State Logic'
    | 'Injection, Parser & Server Boundaries'
    | 'Modern APIs, Client & Runtime'
    | 'Cloud, Mobile, Supply Chain & AI'
    | 'Chaining, Tooling & Independent Research';
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced' | 'Research-Grade';
  estimatedHours: number;
  prerequisites: string[]; // module IDs
  prerequisiteRelations?: ModulePrerequisiteRelation[];
  coreConcepts: string[];
  learningOutcomes: string[];
  masteryRequirements: string[];
  labRequirements?: LabRequirementDefinition[];
  cveCaseStudies?: CveCaseStudy[];
  lessonIds: string[];
  labIds: string[];
  caseStudyIds: string[];
  crossReferences: {
    targetModuleId: string;
    relationship: string;
  }[];
  skillWeights: Partial<Record<SkillDimension, number>>;
  sourceReference: SourceReference;
}

export interface CurriculumStructure {
  version: string;
  lastSynchronizedAt: string;
  totalModules: number;
  totalLessons: number;
  totalLabRequirements: number;
  modules: CurriculumModuleDefinition[];
  prerequisiteGraph: ModulePrerequisiteRelation[];
}

export type CurriculumModule = CurriculumModuleDefinition;

export interface HttpTrafficSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
  path: string;
  protocol: 'HTTP/1.1' | 'HTTP/2';
  headers: Record<string, string>;
  body: string;
}

export interface HttpResponseSpec {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  latencyMs: number;
}

export interface LabMutationPreset {
  id: string;
  label: string;
  variableChanged: string;
  description: string;
  request: HttpTrafficSpec;
  simulatedResponse: HttpResponseSpec;
  isInvariantViolation: boolean;
  isFalsePositiveTrap: boolean;
  analysisExplanation: string;
  evidenceTag: string;
}

export interface InteractiveLab {
  id: string;
  moduleId: string;
  title: string;
  family: string;
  isMysteryLab: boolean;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced' | 'Research-Grade';
  fictionalOrg: string;
  threatModel: string;
  securityInvariant: string;
  baselineActor: string;
  secondaryActor: string;
  baselineRequest: HttpTrafficSpec;
  baselineResponse: HttpResponseSpec;
  mutationPresets: LabMutationPreset[];
  requiredHypothesisKeywords: string[];
  requiredCorrectPresetId: string;
  falsePositiveCheckQuestion: {
    prompt: string;
    options: { id: string; text: string; isCorrect: boolean; explanation: string }[];
  };
  rootCauseOptions: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  progressiveHints: string[];
  solutionExplanation: {
    summary: string;
    whyItWorks: string;
    ruledOutAlternatives: string;
    simulationLimitations: string;
  };
  skillRewards: Partial<Record<SkillDimension, number>>;
}

export interface CaseStudyPacket {
  stepIndex: number;
  stageTitle: string;
  observationTitle: string;
  artifactText: string;
  codeOrTraffic: string;
  hypothesisPrompt: string;
  hypothesisChoices: {
    id: string;
    hypothesisText: string;
    creditLevel: 'primary' | 'defensible-alternative' | 'unsupported';
    reasoningFeedback: string;
  }[];
}

export interface CaseStudy {
  id: string;
  moduleId: string;
  title: string;
  domain: string;
  isFalsePositiveCase: boolean;
  difficulty: 'Intermediate' | 'Advanced' | 'Research-Grade';
  fictionalScenarioSummary: string;
  architectureAndTrustBoundaries: string;
  initialSymptom: string;
  packets: CaseStudyPacket[];
  expertWalkthrough: {
    exposingClue: string;
    establishingProof: string;
    rootCause: string;
    securityImpact: string;
    potentialChain: string;
    limitations: string;
  };
  sourceReference: SourceReference;
}

export type FlashcardQuestionType =
  | 'definition-recall'
  | 'explain-in-own-words'
  | 'identify-the-invariant'
  | 'compare-two-requests'
  | 'order-testing-steps'
  | 'interpret-response'
  | 'find-broken-assumption'
  | 'distinguish-false-positive'
  | 'select-next-experiment'
  | 'trace-root-cause';

export interface FlashcardItem {
  id: string;
  moduleId: string;
  lessonId: string;
  questionType: FlashcardQuestionType;
  conceptName: string;
  prompt: string;
  contextSnippet?: string;
  hint: string;
  idealAnswer: string;
  keyInvariantCheck: string;
  options?: { id: string; text: string; isCorrect: boolean }[];
}

export interface FlashcardReviewState {
  cardId: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  dueTimestamp: number;
  lastConfidence: 1 | 2 | 3 | 4 | 5;
  independentSuccessCount: number;
  hintedAttemptCount: number;
  flaggedForReview: boolean;
  lastReviewedAt?: number;
}

export type NotebookItemType =
  | 'Observation'
  | 'Interpretation'
  | 'Hypothesis'
  | 'Experiment'
  | 'Evidence'
  | 'Counterevidence'
  | 'Conclusion'
  | 'Follow-up';

export type HypothesisVerdict =
  | 'Unverified'
  | 'Confirmed'
  | 'Rejected'
  | 'Inconclusive'
  | 'Needs More Evidence';

export interface EvidenceRecord {
  id: string;
  title: string;
  requestResponseSnapshot: string;
  observedInvariantState: string;
  createdAt: string;
}

export interface ExperimentRecord {
  id: string;
  description: string;
  independentVariable: string;
  expectedResult: string;
  actualResult: string;
  evidenceId?: string;
  verdict: HypothesisVerdict;
  rationale: string;
  createdAt: string;
}

export interface NotebookInvestigation {
  id: string;
  title: string;
  moduleId: string;
  templateType:
    | 'General Investigation'
    | 'API Authorization Matrix'
    | 'Session Transition Table'
    | 'State-Machine Diagram'
    | 'Source-to-Sink Analysis'
    | 'Cloud Trust Boundaries'
    | 'AI-Agent Permission Analysis'
    | 'False-Positive Investigation';
  tags: string[];
  observation: string;
  hypothesisStatement: string;
  invariantTested: string;
  verdict: HypothesisVerdict;
  exceptionRationale?: string;
  experiments: ExperimentRecord[];
  evidenceRecords: EvidenceRecord[];
  counterEvidenceNotes: string;
  rootCauseConclusion: string;
  markdownNotes: string;
  changeHistory: { timestamp: string; summary: string }[];
  updatedAt: string;
}

export interface LessonAnnotation {
  id: string;
  lessonId: string;
  tag: NotebookItemType;
  content: string;
  createdAt: string;
}

export interface ApiEndpointInventoryItem {
  id: string;
  protocol: 'REST' | 'GraphQL' | 'WebSocket';
  method: string;
  pathOrOperation: string;
  apiVersion: string;
  authRequired: boolean;
  actorRole: string;
  tenantScope: 'Single-Tenant' | 'Cross-Tenant-Test' | 'Global';
  objectOwnershipRule: string;
  writableProperties: string[];
  expectedPermission: 'Allow' | 'Deny';
  observedResult: 'Untested' | 'Allowed (Expected)' | 'Denied (Expected)' | 'Allowed (Violation)' | 'Ambiguous';
  evidenceRef: string;
  confidence: 'Opportunity Only' | 'Hypothesis' | 'Validated Evidence';
}

export interface ChainNode {
  id: string;
  type: 'Precondition' | 'Observation' | 'Hypothesis' | 'Confirmed Weakness' | 'Trust Boundary' | 'Impact';
  title: string;
  capabilityBefore: string;
  capabilityAfter: string;
  evidenceRef: string;
  confidence: 'Validated' | 'Speculative';
  invariantAffected: string;
}

export interface ChainEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  causalJustification: string;
  isValidatedLink: boolean;
}

export interface ExploitChainModel {
  id: string;
  title: string;
  startingCapability: string;
  finalDemonstratedImpact: string;
  nodes: ChainNode[];
  edges: ChainEdge[];
}

export interface VulnerabilityReportDraft {
  id: string;
  title: string;
  templateCategory: string;
  affectedAssetInScope: string;
  technicalSeverity: 'Low' | 'Medium' | 'High' | 'Critical';
  demonstratedImpactLevel: string;
  uncertaintyNotes: string;
  prerequisites: string;
  reproductionSteps: string;
  expectedBehavior: string;
  actualBehavior: string;
  sanitizedEvidence: string;
  evidenceReferences: string[];
  rootCause: string;
  remediationGuidance: string;
  limitationsAndScope: string;
  falsePositiveReview: string;
  updatedAt: string;
}

export interface LabAttemptRecord {
  labId: string;
  completed: boolean;
  hypothesisSubmitted: string;
  selectedPresetId: string;
  falsePositiveCheckPassed: boolean;
  rootCausePassed: boolean;
  hintsUsed: number;
  solutionViewed: boolean;
  attemptsCount: number;
  lastAttemptAt: string;
}

export interface CaseStudyAttemptRecord {
  caseStudyId: string;
  unlockedStepIndex: number;
  completed: boolean;
  committedHypotheses: Record<number, string>;
  finalConclusionText: string;
  reasoningScore: number;
  updatedAt: string;
}

export interface LearnerState {
  schemaVersion: number;
  activeRoute: string;
  activeModuleId: string;
  activeLessonId: string;
  activeLabId: string;
  activeCaseStudyId: string;
  goalTrack:
    | 'Full-Spectrum Security Researcher'
    | 'API & Authorization Specialist'
    | 'Browser & Client-Side Researcher'
    | 'Cloud & Supply-Chain Security'
    | 'Mobile & Android Security'
    | 'AI, RAG & Agentic Security';
  dailyTargetMinutes: number;
  weeklyStudyMinutes: number[]; // 7 days Mon-Sun
  readingCompletedLessonIds: string[];
  assessmentPassedLessonIds: string[];
  masteredLessonIds: string[];
  skippedPrerequisiteModuleIds: string[];
  skillScores: Record<SkillDimension, number>;
  labAttempts: Record<string, LabAttemptRecord>;
  caseStudyAttempts: Record<string, CaseStudyAttemptRecord>;
  flashcardReviews: Record<string, FlashcardReviewState>;
  notebookInvestigations: NotebookInvestigation[];
  lessonAnnotations: LessonAnnotation[];
  apiInventory: ApiEndpointInventoryItem[];
  exploitChains: ExploitChainModel[];
  reports: VulnerabilityReportDraft[];
  theme: 'dark' | 'light';
  readingMode: boolean;
}
