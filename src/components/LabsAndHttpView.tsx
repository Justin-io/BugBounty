import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import { INTERACTIVE_LABS } from '../data/labsAndCasesData';
import { LabEvaluationResult } from '../utils/researchEngine';
import {
  CheckCircle2,
  Code2,
  Eye,
  FlaskConical,
  HelpCircle,
  Play,
  RotateCcw,
  ShieldAlert,
  Terminal,
} from 'lucide-react';

export const LabsAndHttpView: React.FC = () => {
  const {
    state,
    navigate,
    submitLabAttempt,
    resetLabAttempt,
    addEvidenceToInvestigation,
  } = useAcademy();

  const currentLab =
    INTERACTIVE_LABS.find((l) => l.id === state.activeLabId) ||
    INTERACTIVE_LABS[0];
  const existingAttempt = state.labAttempts[currentLab.id];

  const [hypothesisText, setHypothesisText] = useState<string>(
    existingAttempt?.hypothesisSubmitted || ''
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    existingAttempt?.selectedPresetId || currentLab.mutationPresets[0]?.id || ''
  );
  const [fpOptionId, setFpOptionId] = useState<string>('');
  const [rcOptionId, setRcOptionId] = useState<string>('');
  const [hintsRevealed, setHintsRevealed] = useState<number>(0);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<LabEvaluationResult | null>(null);
  const [mutationHistory, setMutationHistory] = useState<
    { timestamp: string; label: string; status: number; variable: string }[]
  >([]);

  // Freeform HTTP Explorer & Encoder Tools
  const [customMethod, setCustomMethod] = useState<string>(
    currentLab.baselineRequest.method
  );
  const [customPath, setCustomPath] = useState<string>(
    currentLab.baselineRequest.path
  );
  const [customHeadersText, setCustomHeadersText] = useState<string>(
    Object.entries(currentLab.baselineRequest.headers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
  );
  const [customBody, setCustomBody] = useState<string>(
    currentLab.baselineRequest.body
  );
  const [codecInput, setCodecInput] = useState<string>(
    '/api/public/..;/internal/ClusterDiagnostics'
  );
  const [notebookBanner, setNotebookBanner] = useState<string | null>(null);

  const activePreset =
    currentLab.mutationPresets.find((p) => p.id === selectedPresetId) ||
    currentLab.mutationPresets[0];

  const handleSwitchLab = (labId: string) => {
    const nextLab = INTERACTIVE_LABS.find((l) => l.id === labId);
    if (!nextLab) return;
    const saved = state.labAttempts[labId];
    setHypothesisText(saved?.hypothesisSubmitted || '');
    setSelectedPresetId(
      saved?.selectedPresetId || nextLab.mutationPresets[0]?.id || ''
    );
    setFpOptionId('');
    setRcOptionId('');
    setHintsRevealed(0);
    setShowSolution(false);
    setEvalResult(null);
    setCustomMethod(nextLab.baselineRequest.method);
    setCustomPath(nextLab.baselineRequest.path);
    setCustomHeadersText(
      Object.entries(nextLab.baselineRequest.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    );
    setCustomBody(nextLab.baselineRequest.body);
    navigate('labs', { labId });
  };

  const handleRunMutationPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = currentLab.mutationPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setCustomMethod(preset.request.method);
    setCustomPath(preset.request.path);
    setCustomHeadersText(
      Object.entries(preset.request.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    );
    setCustomBody(preset.request.body);
    setMutationHistory((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        label: preset.label,
        status: preset.simulatedResponse.status,
        variable: preset.variableChanged,
      },
      ...prev.slice(0, 9),
    ]);
  };

  const handleSubmitValidation = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitLabAttempt(currentLab, {
      hypothesisText,
      selectedPresetId,
      falsePositiveOptionId: fpOptionId,
      rootCauseOptionId: rcOptionId,
      hintsUsed: hintsRevealed,
      solutionViewed: showSolution,
    });
    setEvalResult(res);
  };

  const handleSendEvidenceToNotebook = () => {
    if (!activePreset) return;
    const targetInv = state.notebookInvestigations[0];
    if (!targetInv) return;

    addEvidenceToInvestigation(
      targetInv.id,
      `${currentLab.title} — Preset (${activePreset.variableChanged})`,
      `MUTATION REQUEST:\n${customMethod} ${customPath} HTTP/1.1\n${customHeadersText}\n\n${customBody}\n\n` +
      `SERVER RESPONSE (HTTP ${activePreset.simulatedResponse.status}):\n` +
      Object.entries(activePreset.simulatedResponse.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n') +
      `\n\n${activePreset.simulatedResponse.body}`,
      activePreset.isInvariantViolation
        ? 'Invariant Violated (Differential verified)'
        : 'Invariant Preserved (Baseline response)'
    );
    setNotebookBanner(
      `Evidence record ${activePreset.evidenceTag} attached to Notebook investigation "${targetInv.title}".`
    );
    setTimeout(() => setNotebookBanner(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Lab Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-sky-700 font-semibold uppercase tracking-wider">
              Deterministic Protocol & Vulnerability Laboratory · Safe Local Fixtures
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 font-display tracking-tight">
              Interactive Vulnerability Labs & HTTP Differential Workbench
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              SIMULATION DISCLOSURE: All traffic executes against deterministic local teaching fixtures. No packets are transmitted to external networks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetLabAttempt(currentLab.id);
                setHypothesisText('');
                setEvalResult(null);
                setMutationHistory([]);
              }}
              className="px-3 py-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-md flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Lab State</span>
            </button>
          </div>
        </div>

        {/* Lab Selection Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
          {INTERACTIVE_LABS.map((lab) => {
            const isSelected = lab.id === currentLab.id;
            const isDone = state.labAttempts[lab.id]?.completed;
            return (
              <button
                key={lab.id}
                type="button"
                onClick={() => handleSwitchLab(lab.id)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className={lab.isMysteryLab ? 'text-amber-800 font-bold' : 'text-sky-700 font-semibold'}>
                    {lab.isMysteryLab ? 'MYSTERY LAB' : lab.difficulty.toUpperCase()}
                  </span>
                  {isDone && (
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>VALIDATED</span>
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold mt-1.5 line-clamp-2">
                  {lab.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Threat Model & Security Invariant Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1 text-xs">
          <div className="text-slate-500 font-mono font-medium uppercase tracking-wider">
            Target Environment & Actors
          </div>
          <div className="text-sm font-bold text-slate-900">
            {currentLab.fictionalOrg}
          </div>
          <div className="text-slate-700 pt-1">
            <strong>Primary Actor:</strong> {currentLab.baselineActor}
          </div>
          <div className="text-slate-700">
            <strong>Secondary Actor:</strong> {currentLab.secondaryActor}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1 text-xs">
          <div className="text-slate-500 font-mono font-medium uppercase tracking-wider">
            Architecture & Threat Model
          </div>
          <p className="text-slate-700 leading-relaxed font-medium">{currentLab.threatModel}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-1 text-xs">
          <div className="text-emerald-700 font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Target Security Invariant</span>
          </div>
          <p className="text-slate-900 font-semibold leading-relaxed">
            {currentLab.securityInvariant}
          </p>
        </div>
      </div>

      {/* Side-by-Side HTTP Baseline vs. Controlled Mutation Workbench */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-700" />
              <span>Controlled Single-Variable Mutation Selector</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select a controlled mutation preset below and compare the response differential against the Baseline.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSendEvidenceToNotebook}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-sky-800 font-semibold text-xs rounded-md whitespace-nowrap shadow-2xs"
          >
            Attach Active Diff to Notebook ({activePreset?.evidenceTag})
          </button>
        </div>

        {notebookBanner && (
          <div
            role="status"
            className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between font-medium"
          >
            <span>{notebookBanner}</span>
            <button
              type="button"
              onClick={() => navigate('notebook')}
              className="underline font-bold"
            >
              Open Notebook
            </button>
          </div>
        )}

        {/* Mutation Preset Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {currentLab.mutationPresets.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleRunMutationPreset(preset.id)}
                className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-medium shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-sky-700 font-bold">
                    <span>Variable: {preset.variableChanged}</span>
                    <Play className="w-3 h-3" />
                  </div>
                  <div className="text-xs font-bold mt-1 text-slate-900">{preset.label}</div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] font-mono flex items-center justify-between text-slate-500 font-medium">
                  <span>Tag: {preset.evidenceTag}</span>
                  <span className="font-bold text-slate-800">
                    HTTP {preset.simulatedResponse.status}{' '}
                    {preset.simulatedResponse.statusText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Side-by-Side Baseline vs Mutated HTTP Traffic */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Baseline Column */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-slate-100 shadow-inner">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200">
                1. Recorded Baseline Traffic
              </span>
              <span className="font-mono text-slate-400 tabular-nums">
                HTTP {currentLab.baselineResponse.status} ·{' '}
                {currentLab.baselineResponse.latencyMs}ms
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono text-slate-400">
                Baseline Request:
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800/80">
                {`${currentLab.baselineRequest.method} ${currentLab.baselineRequest.path} ${currentLab.baselineRequest.protocol}\n` +
                  Object.entries(currentLab.baselineRequest.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n') +
                  (currentLab.baselineRequest.body
                    ? `\n\n${currentLab.baselineRequest.body}`
                    : '')}
              </pre>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono text-slate-400">
                Baseline Response:
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800/80">
                {`HTTP/1.1 ${currentLab.baselineResponse.status} ${currentLab.baselineResponse.statusText}\n` +
                  Object.entries(currentLab.baselineResponse.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('\n') +
                  `\n\n${currentLab.baselineResponse.body}`}
              </pre>
            </div>
          </div>

          {/* Mutated Column */}
          {activePreset && (
            <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-4 space-y-3 text-slate-100 shadow-inner">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                <span className="font-bold text-sky-400">
                  2. Controlled Mutation ({activePreset.variableChanged})
                </span>
                <span className="font-mono text-sky-400 tabular-nums">
                  HTTP {activePreset.simulatedResponse.status} ·{' '}
                  {activePreset.simulatedResponse.latencyMs}ms
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-mono text-amber-300 font-semibold">
                  Mutated Request (Editable Inspector):
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    aria-label="HTTP Method"
                    value={customMethod}
                    onChange={(e) => setCustomMethod(e.target.value)}
                    className="col-span-1 px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-amber-300 focus:outline-none"
                  />
                  <input
                    type="text"
                    aria-label="HTTP Path"
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    className="col-span-3 px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-amber-200 focus:outline-none"
                  />
                </div>
                <textarea
                  rows={3}
                  aria-label="HTTP Headers"
                  value={customHeadersText}
                  onChange={(e) => setCustomHeadersText(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-slate-200 focus:outline-none"
                />
                {customBody && (
                  <textarea
                    rows={3}
                    aria-label="HTTP Body"
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full p-2 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-amber-100 focus:outline-none"
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                  Simulated Fixture Response:
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-emerald-200 font-mono text-xs overflow-x-auto border border-slate-800/80">
                  {`HTTP/1.1 ${activePreset.simulatedResponse.status} ${activePreset.simulatedResponse.statusText}\n` +
                    Object.entries(activePreset.simulatedResponse.headers)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join('\n') +
                    `\n\n${activePreset.simulatedResponse.body}`}
                </pre>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="font-semibold text-sky-400">
                  Differential Analysis:{' '}
                </span>
                <span className="text-slate-300 font-medium">
                  {activePreset.analysisExplanation}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Encoder / Decoder Utility & Mutation History Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-200">
          <div className="lg:col-span-6 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-sky-700" />
                <span>Protocol Payload Encoder / Decoder</span>
              </span>
            </div>
            <input
              type="text"
              aria-label="Codec Input"
              value={codecInput}
              onChange={(e) => setCodecInput(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded font-mono text-xs text-slate-900 focus:outline-none focus:border-sky-600"
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setCodecInput(encodeURIComponent(codecInput))}
                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded font-mono text-[11px]"
              >
                URL Encode
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    setCodecInput(decodeURIComponent(codecInput));
                  } catch {
                    // ignore
                  }
                }}
                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded font-mono text-[11px]"
              >
                URL Decode
              </button>
              <button
                type="button"
                onClick={() => setCodecInput(btoa(codecInput))}
                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded font-mono text-[11px]"
              >
                Base64 Encode
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    setCodecInput(atob(codecInput));
                  } catch {
                    // ignore
                  }
                }}
                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium rounded font-mono text-[11px]"
              >
                Base64 Decode
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="font-bold text-slate-800">
              Experiment Mutation Timeline ({mutationHistory.length} runs)
            </div>
            {mutationHistory.length === 0 ? (
              <p className="text-slate-500">
                Click any mutation preset above to log a timestamped differential trace.
              </p>
            ) : (
              <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[11px]">
                {mutationHistory.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-slate-700"
                  >
                    <span className="truncate">
                      [{m.timestamp}] {m.variable}
                    </span>
                    <span className="text-sky-700 font-bold shrink-0 ml-2">
                      HTTP {m.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lab Validation & Proof Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmitValidation}
          className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div>
            <div className="text-xs font-mono text-sky-700 font-semibold uppercase tracking-wider">
              Evidence-Based Lab Evaluation Engine
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Submit Hypothesis, False-Positive Check & Root-Cause Conclusion
            </h2>
          </div>

          {/* 1. Hypothesis Field */}
          <div>
            <label
              htmlFor="lab-hypothesis-input"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              1. Testable Hypothesis Statement (Keywords: {currentLab.requiredHypothesisKeywords.slice(0, 4).join(', ')})
            </label>
            <textarea
              id="lab-hypothesis-input"
              rows={2}
              required
              value={hypothesisText}
              onChange={(e) => setHypothesisText(e.target.value)}
              placeholder={`e.g., If the endpoint fails to enforce ${currentLab.requiredHypothesisKeywords[0]}, then mutating ${currentLab.requiredHypothesisKeywords[1]} will violate the boundary...`}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white"
            />
          </div>

          {/* 2. Selected Mutation Confirmation */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium">2. Selected Evidence Preset: </span>
              <strong className="text-sky-900">{activePreset?.label}</strong>
            </div>
            <span className="font-mono text-slate-600 font-semibold">
              {activePreset?.evidenceTag}
            </span>
          </div>

          {/* 3. False-Positive Check Question */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-800">
              3. False-Positive Exclusion Check: {currentLab.falsePositiveCheckQuestion.prompt}
            </div>
            {currentLab.falsePositiveCheckQuestion.options.map((opt) => (
              <label
                key={opt.id}
                className={`block p-2.5 rounded-md border cursor-pointer transition-all ${
                  fpOptionId === opt.id
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-medium shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="lab-fp-check"
                  value={opt.id}
                  checked={fpOptionId === opt.id}
                  onChange={() => setFpOptionId(opt.id)}
                  className="mr-2 text-sky-600"
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>

          {/* 4. Root-Cause Selection */}
          <div className="space-y-2 text-xs">
            <div className="font-bold text-slate-800">
              4. Identify the Underlying Root Cause:
            </div>
            {currentLab.rootCauseOptions.map((opt) => (
              <label
                key={opt.id}
                className={`block p-2.5 rounded-md border cursor-pointer transition-all ${
                  rcOptionId === opt.id
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-medium shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="lab-rc-check"
                  value={opt.id}
                  checked={rcOptionId === opt.id}
                  onChange={() => setRcOptionId(opt.id)}
                  className="mr-2 text-sky-600"
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-md flex items-center gap-2 shadow-xs"
          >
            <FlaskConical className="w-4 h-4 text-sky-400" />
            <span>Validate Lab Investigation</span>
          </button>

          {evalResult && (
            <div
              role="status"
              className={`p-4 rounded-lg border text-xs space-y-1.5 ${
                evalResult.passed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-amber-300 bg-amber-50 text-amber-950'
              }`}
            >
              <div className="font-bold text-sm">
                {evalResult.passed
                  ? 'Investigation Validated — Security Invariant Violation Proven'
                  : 'Investigation Incomplete — Review Diagnostic Feedback:'}
              </div>
              <ul className="list-disc list-inside space-y-1">
                {evalResult.feedback.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </form>

        {/* Right 4 cols: Progressive Hints & Solution Walkthrough */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-700" />
                <span>Progressive Conceptual Hints</span>
              </h3>
              <span className="font-mono text-slate-500 font-semibold">
                {hintsRevealed} / {currentLab.progressiveHints.length}
              </span>
            </div>

            <button
              type="button"
              disabled={hintsRevealed >= currentLab.progressiveHints.length}
              onClick={() =>
                setHintsRevealed((h) =>
                  Math.min(currentLab.progressiveHints.length, h + 1)
                )
              }
              className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium rounded-md disabled:opacity-40 shadow-2xs"
            >
              Reveal Next Hint
            </button>

            {hintsRevealed > 0 && (
              <div className="space-y-2 pt-2">
                {currentLab.progressiveHints
                  .slice(0, hintsRevealed)
                  .map((hint, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700"
                    >
                      {hint}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-amber-700" />
                <span>Expert Solution Walkthrough</span>
              </h3>
            </div>
            <p className="text-slate-500">
              Viewing the solution before validating records an assisted walkthrough rather than independent lab mastery.
            </p>
            <button
              type="button"
              onClick={() => setShowSolution(!showSolution)}
              className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold rounded-md shadow-2xs"
            >
              {showSolution ? 'Hide Solution Walkthrough' : 'Reveal Solution Analysis'}
            </button>

            {showSolution && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-slate-700">
                <div>
                  <strong className="text-slate-900">Summary: </strong>
                  {currentLab.solutionExplanation.summary}
                </div>
                <div>
                  <strong className="text-emerald-700">Why It Works: </strong>
                  {currentLab.solutionExplanation.whyItWorks}
                </div>
                <div>
                  <strong className="text-amber-800">Ruled-Out Alternatives: </strong>
                  {currentLab.solutionExplanation.ruledOutAlternatives}
                </div>
                <div>
                  <strong className="text-slate-500">Simulation Fidelity Note: </strong>
                  {currentLab.solutionExplanation.simulationLimitations}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
