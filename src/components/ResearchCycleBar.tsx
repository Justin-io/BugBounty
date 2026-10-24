import React, { useState } from 'react';
import { ResearchCycleStep } from '../types/domain';
import { ArrowRight, Compass, CheckCircle2 } from 'lucide-react';

interface StageMeta {
  id: ResearchCycleStep;
  label: string;
  question: string;
  artifactProduced: string;
  pitfallToAvoid: string;
  targetRoute: string;
}

const CYCLE_STAGES: StageMeta[] = [
  {
    id: 'STUDY',
    label: '1. Study',
    question: 'What protocol mechanism or architectural rule governs this component?',
    artifactProduced: 'Core mental model & prerequisite concept map',
    pitfallToAvoid: 'Memorizing payload strings without understanding the underlying parser.',
    targetRoute: 'lesson',
  },
  {
    id: 'MODEL',
    label: '2. Model',
    question: 'Where are the trust boundaries, actors, and security invariants?',
    artifactProduced: 'Trust boundary diagram & invariant definition',
    pitfallToAvoid: 'Assuming client-side UI restrictions are enforced on the server.',
    targetRoute: 'workbenches',
  },
  {
    id: 'BASELINE',
    label: '3. Baseline',
    question: 'How does the system respond to a known-good, authorized request?',
    artifactProduced: 'Recorded baseline HTTP request/response & status norms',
    pitfallToAvoid: 'Mutating multiple parameters before recording normal application behavior.',
    targetRoute: 'labs',
  },
  {
    id: 'HYPOTHESIS',
    label: '4. Hypothesis',
    question: 'If invariant X is missing at boundary Y, what single mutation will prove it?',
    artifactProduced: 'Falsifiable hypothesis statement in Research Notebook',
    pitfallToAvoid: 'Vague claims like "maybe this endpoint is vulnerable to something."',
    targetRoute: 'notebook',
  },
  {
    id: 'CONTROLLED_MUTATION',
    label: '5. Mutation',
    question: 'What changes when I alter exactly one independent variable?',
    artifactProduced: 'Baseline vs. Mutated semantic diff',
    pitfallToAvoid: 'Changing auth tokens, paths, and headers simultaneously.',
    targetRoute: 'labs',
  },
  {
    id: 'VALIDATION',
    label: '6. Validation',
    question: 'Could this response be a benign fallback, cache miss, or false positive?',
    artifactProduced: 'Verified Evidence Record + False-Positive exclusion note',
    pitfallToAvoid: 'Reporting an SPA 200 OK HTML shell or uncached header echo as a bug.',
    targetRoute: 'cases',
  },
  {
    id: 'IMPACT',
    label: '7. Impact',
    question: 'What concrete capability does an attacker gain across a real boundary?',
    artifactProduced: 'Demonstrated capability statement within authorized scope',
    pitfallToAvoid: 'Claiming theoretical RCE or ATO without demonstrating boundary traversal.',
    targetRoute: 'labs',
  },
  {
    id: 'CHAIN',
    label: '8. Chain',
    question: 'Does this validated output satisfy the precondition of a higher-impact node?',
    artifactProduced: 'Validated Exploit-Chain graph',
    pitfallToAvoid: 'Linking two unrelated low-severity observations with speculative edges.',
    targetRoute: 'reporting',
  },
  {
    id: 'REPORT',
    label: '9. Report',
    question: 'Can a triage engineer reproduce and verify the invariant violation in 2 minutes?',
    artifactProduced: 'Sanitized, proof-checked Vulnerability Report',
    pitfallToAvoid: 'Omitting expected vs. actual behavior or leaving unredacted tokens.',
    targetRoute: 'reporting',
  },
  {
    id: 'NEW_HYPOTHESIS',
    label: '10. Next Loop',
    question: 'Where else in the architecture does this same coding pattern or parser exist?',
    artifactProduced: 'Follow-up research drill & spaced-repetition cards',
    pitfallToAvoid: 'Stopping after one endpoint without checking sibling API versions.',
    targetRoute: 'review',
  },
];

export const ResearchCycleBar: React.FC<{
  activeStep?: ResearchCycleStep;
  onNavigate?: (route: string) => void;
}> = ({ activeStep = 'STUDY', onNavigate }) => {
  const [selectedStage, setSelectedStage] = useState<StageMeta | null>(null);

  return (
    <section
      aria-label="10-Stage Security Research Cycle"
      className="border-b border-slate-200 bg-white px-4 py-2"
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <Compass className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-semibold text-slate-700 hidden sm:inline">Research Cycle:</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar text-xs">
            {CYCLE_STAGES.map((stage, idx) => {
              const isCurrent = stage.id === activeStep;
              const isSelected = selectedStage?.id === stage.id;
              return (
                <React.Fragment key={stage.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStage(isSelected ? null : stage)
                    }
                    className={`px-2.5 py-1 text-xs rounded transition-all whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 text-white font-semibold shadow-xs'
                        : isCurrent
                        ? 'bg-sky-50 text-sky-800 border border-sky-300 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {stage.label}
                  </button>
                  {idx < CYCLE_STAGES.length - 1 && (
                    <span className="text-slate-300 text-[10px] select-none" aria-hidden="true">
                      →
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {selectedStage && (
          <div className="mt-2.5 p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs grid grid-cols-1 md:grid-cols-4 gap-3 items-center shadow-xs">
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Core Research Question</div>
              <div className="text-slate-900 font-semibold mt-0.5">
                {selectedStage.question}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Required Proof Artifact</div>
              <div className="text-emerald-700 font-semibold mt-0.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>{selectedStage.artifactProduced}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Analytical Pitfall to Reject</div>
              <div className="text-amber-800 font-medium mt-0.5">
                {selectedStage.pitfallToAvoid}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(selectedStage.targetRoute);
                    setSelectedStage(null);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs shadow-xs"
                >
                  <span>Open Stage Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedStage(null)}
                className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 bg-white rounded whitespace-nowrap shrink-0 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
