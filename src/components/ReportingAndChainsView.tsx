import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  evaluateReportQuality,
  validateExploitChain,
} from '../utils/researchEngine';
import {
  ChainNode,
  ExploitChainModel,
  VulnerabilityReportDraft,
} from '../types/domain';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  GitBranch,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

const REPORT_TEMPLATES = [
  'Authorization Failure (BOLA / IDOR)',
  'Broken Function Level Authorization (BFLA)',
  'OAuth / OIDC Account-Linking Collision',
  'Business Logic & TOCTOU Concurrency',
  'SSRF & Cloud Metadata Boundary',
  'Client-Side DOM XSS / postMessage',
  'AI / RAG Retrieval & Agent Tool Boundary',
];

export const ReportingAndChainsView: React.FC = () => {
  const { state, saveExploitChain, saveReportDraft } = useAcademy();
  const [subTab, setSubTab] = useState<'chains' | 'report'>('chains');

  // Exploit Chain state
  const [chainDraft, setChainDraft] = useState<ExploitChainModel>(
    state.exploitChains[0]
  );
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeType, setNewNodeType] = useState<ChainNode['type']>('Confirmed Weakness');
  const [newNodeCapAfter, setNewNodeCapAfter] = useState('');
  const [newNodeEvidence, setNewNodeEvidence] = useState('EV-BOLA-V1-200');
  const [newNodeConfidence, setNewNodeConfidence] = useState<'Validated' | 'Speculative'>('Validated');
  const [newEdgeJustification, setNewEdgeJustification] = useState(
    'Output token from previous step authenticates into downstream controller.'
  );
  const [chainSavedMsg, setChainSavedMsg] = useState<string | null>(null);

  // Report Studio state
  const [reportDraft, setReportDraft] = useState<VulnerabilityReportDraft>(
    state.reports[0]
  );
  const [reportSavedMsg, setReportSavedMsg] = useState<string | null>(null);
  const [showMarkdownPreview, setShowMarkdownPreview] = useState<boolean>(false);

  const chainValidation = validateExploitChain(chainDraft);
  const reportQuality = evaluateReportQuality(reportDraft);

  const handleAddChainNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim()) return;
    const prevLastNode = chainDraft.nodes[chainDraft.nodes.length - 1];
    const newNodeId = `cn-${Date.now()}`;
    const newNode: ChainNode = {
      id: newNodeId,
      type: newNodeType,
      title: newNodeTitle.trim(),
      capabilityBefore: prevLastNode?.capabilityAfter || 'Initial Actor State',
      capabilityAfter: newNodeCapAfter.trim() || 'Elevated Capability',
      evidenceRef: newNodeEvidence.trim(),
      confidence: newNodeConfidence,
      invariantAffected: 'Cross-boundary state transition',
    };

    const nextEdges = prevLastNode
      ? [
          ...chainDraft.edges,
          {
            id: `ce-${Date.now()}`,
            fromNodeId: prevLastNode.id,
            toNodeId: newNodeId,
            causalJustification: newEdgeJustification.trim(),
            isValidatedLink: newNodeConfidence === 'Validated',
          },
        ]
      : chainDraft.edges;

    const updated: ExploitChainModel = {
      ...chainDraft,
      nodes: [...chainDraft.nodes, newNode],
      edges: nextEdges,
    };
    setChainDraft(updated);
    saveExploitChain(updated);
    setNewNodeTitle('');
    setNewNodeCapAfter('');
    setChainSavedMsg('Added node & causal link to Exploit Chain.');
  };

  const handleRemoveLastNode = () => {
    if (chainDraft.nodes.length <= 2) return;
    const removed = chainDraft.nodes[chainDraft.nodes.length - 1];
    const updated: ExploitChainModel = {
      ...chainDraft,
      nodes: chainDraft.nodes.slice(0, -1),
      edges: chainDraft.edges.filter(
        (e) => e.fromNodeId !== removed.id && e.toNodeId !== removed.id
      ),
    };
    setChainDraft(updated);
    saveExploitChain(updated);
  };

  const generateReportMarkdown = (r: VulnerabilityReportDraft) => {
    return `# ${r.title}
- **Category:** ${r.templateCategory}
- **Affected Asset (In Scope):** \`${r.affectedAssetInScope}\`
- **Technical Severity:** ${r.technicalSeverity}
- **Evidence References:** ${r.evidenceReferences.join(', ') || 'None'}

## 1. Demonstrated Impact & Uncertainty Boundaries
${r.demonstratedImpactLevel}

**Scope & Limitations:** ${r.limitationsAndScope}
**Uncertainty Notes:** ${r.uncertaintyNotes || 'All steps deterministically verified.'}

## 2. Prerequisites & Test Actors
${r.prerequisites}

## 3. Deterministic Reproduction Steps
${r.reproductionSteps}

## 4. Security Invariant: Expected vs. Actual Behavior
- **Expected Invariant Behavior:** ${r.expectedBehavior}
- **Actual Observed Behavior:** ${r.actualBehavior}

## 5. Sanitized Request / Response Proof
\`\`\`http
${r.sanitizedEvidence}
\`\`\`

## 6. Root Cause & False-Positive Exclusion
- **Root Cause:** ${r.rootCause}
- **False-Positive Review:** ${r.falsePositiveReview}

## 7. Remediation Guidance
${r.remediationGuidance}
`;
  };

  const handleExportReportMarkdown = () => {
    const md = generateReportMarkdown(reportDraft);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportDraft.id}-vulnerability-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-sky-50 text-sky-800 border border-sky-200 mb-2">
            Causal Exploit-Chain Reasoning · Triage-Grade Report Studio
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Exploit-Chain Builder & Report Studio
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Distinguish validated causal transitions from speculative assumptions, and verify every report against the 7-point Triage Proof-Obligation Checklist.
          </p>
        </div>

        <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('chains')}
            className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 font-medium transition-colors ${
              subTab === 'chains'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Chain Builder</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('report')}
            className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 font-medium transition-colors ${
              subTab === 'report'
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Report Studio ({reportQuality.readinessScore}%)</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: EXPLOIT-CHAIN BUILDER */}
      {subTab === 'chains' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 cols: Chain Canvas & Nodes */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {chainDraft.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Starting Capability: <strong className="text-slate-800">{chainDraft.startingCapability}</strong> → Terminal Impact: <strong className="text-emerald-700 font-bold">{chainDraft.finalDemonstratedImpact}</strong>
                </p>
              </div>
              {chainDraft.nodes.length > 2 && (
                <button
                  type="button"
                  onClick={handleRemoveLastNode}
                  className="px-2.5 py-1 text-xs bg-white hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-700 rounded-md flex items-center gap-1 font-medium transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Last Node</span>
                </button>
              )}
            </div>

            {/* Chain Nodes Sequence */}
            <div className="space-y-4">
              {chainDraft.nodes.map((node, idx) => {
                const outgoingEdge = chainDraft.edges.find(
                  (e) => e.fromNodeId === node.id
                );
                return (
                  <React.Fragment key={node.id}>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-semibold text-sky-800">
                          STEP 0{idx + 1} · {node.type.toUpperCase()}
                        </span>
                        <span
                          className={`font-semibold ${
                            node.confidence === 'Validated'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }`}
                        >
                          Confidence: {node.confidence.toUpperCase()} · Evidence:{' '}
                          {node.evidenceRef || 'MISSING'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {node.title}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-500 font-medium">Precondition: </span>
                          <span className="text-slate-800">{node.capabilityBefore}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <span className="text-slate-500 font-medium">Resulting Capability: </span>
                          <span className="text-emerald-800 font-bold">
                            {node.capabilityAfter}
                          </span>
                        </div>
                      </div>
                    </div>

                    {outgoingEdge && (
                      <div className="pl-6 border-l-2 border-slate-300 py-1 text-xs font-mono text-slate-600">
                        ↓ Causal Link ({outgoingEdge.isValidatedLink ? 'Validated' : 'Speculative'}):{' '}
                        <span className="text-slate-900 font-medium">
                          {outgoingEdge.causalJustification}
                        </span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Add Node to Chain Form */}
            <form
              onSubmit={handleAddChainNode}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
            >
              <div className="font-bold text-slate-900">
                Append Step to Exploit Chain (Verified Against Causal Integrity Rules)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="cn-title" className="block text-slate-700 font-semibold mb-1">
                    Node Title
                  </label>
                  <input
                    id="cn-title"
                    type="text"
                    required
                    value={newNodeTitle}
                    onChange={(e) => setNewNodeTitle(e.target.value)}
                    placeholder="e.g., Replay Webhook Secret to Admin Hook"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="cn-type" className="block text-slate-700 font-semibold mb-1">
                    Node Classification
                  </label>
                  <select
                    id="cn-type"
                    value={newNodeType}
                    onChange={(e) =>
                      setNewNodeType(e.target.value as ChainNode['type'])
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Confirmed Weakness">Confirmed Weakness</option>
                    <option value="Impact">Terminal Impact</option>
                    <option value="Hypothesis">Unverified Hypothesis</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cn-conf" className="block text-slate-700 font-semibold mb-1">
                    Confidence Level
                  </label>
                  <select
                    id="cn-conf"
                    value={newNodeConfidence}
                    onChange={(e) =>
                      setNewNodeConfidence(
                        e.target.value as 'Validated' | 'Speculative'
                      )
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    <option value="Validated">Validated (Evidence-Backed)</option>
                    <option value="Speculative">Speculative (Unproven Assumption)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cn-cap" className="block text-slate-700 font-semibold mb-1">
                    Resulting Attacker Capability
                  </label>
                  <input
                    id="cn-cap"
                    type="text"
                    required
                    value={newNodeCapAfter}
                    onChange={(e) => setNewNodeCapAfter(e.target.value)}
                    placeholder="e.g., Forged Tenant Beta Settlement Event"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="cn-ev" className="block text-slate-700 font-semibold mb-1">
                    Evidence Reference ID
                  </label>
                  <input
                    id="cn-ev"
                    type="text"
                    value={newNodeEvidence}
                    onChange={(e) => setNewNodeEvidence(e.target.value)}
                    placeholder="e.g., EV-BOLA-V1-200"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded font-mono text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center gap-1.5 text-xs shadow-xs min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Node & Validate Chain</span>
              </button>
              {chainSavedMsg && (
                <div className="text-emerald-800 font-medium">{chainSavedMsg}</div>
              )}
            </form>
          </div>

          {/* Right 4 cols: Causal Integrity & Evidence Validator */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <div>
              <div className="font-mono text-sky-800 font-semibold">
                Causal Link & Invariant Validator
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                Chain Proof Audit
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Validated Links</div>
                <div className="text-xl font-bold text-emerald-700 tabular-nums mt-0.5">
                  {chainValidation.validatedTransitionCount}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-slate-500 text-[11px]">Speculative Links</div>
                <div className="text-xl font-bold text-amber-700 tabular-nums mt-0.5">
                  {chainValidation.speculativeTransitionCount}
                </div>
              </div>
            </div>

            {chainValidation.isValidChain ? (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Causal Chain Verified</span>
                </div>
                <p className="leading-relaxed">
                  Every node carries an explicit evidence reference, no duplicate impact claims exist, and all edges are validated.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Causal Chain Notices:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 leading-relaxed">
                  {chainValidation.issues.map((iss, i) => (
                    <li key={i}>{iss}</li>
                  ))}
                  {chainValidation.speculativeTransitionCount > 0 && (
                    <li>
                      Contains {chainValidation.speculativeTransitionCount} speculative transition(s) — must be proven before claiming chained severity.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: REPORT STUDIO & TRIAGE CHECKLIST */}
      {subTab === 'report' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 8 cols: Report Editor or Markdown Preview */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMarkdownPreview(false)}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                    !showMarkdownPreview
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Structured Editor
                </button>
                <button
                  type="button"
                  onClick={() => setShowMarkdownPreview(true)}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
                    showMarkdownPreview
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Markdown Preview
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    saveReportDraft(reportDraft);
                    setReportSavedMsg('Report draft saved to local workspace.');
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md text-xs shadow-xs min-h-[36px]"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={handleExportReportMarkdown}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-md text-xs flex items-center gap-1 shadow-xs min-h-[36px]"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export .md</span>
                </button>
              </div>
            </div>

            {reportSavedMsg && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                {reportSavedMsg}
              </div>
            )}

            {showMarkdownPreview ? (
              <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-100 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                {generateReportMarkdown(reportDraft)}
              </pre>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label htmlFor="rep-title" className="block text-slate-700 font-semibold mb-1">
                      Report Title (Mechanism + Endpoint + Impact)
                    </label>
                    <input
                      id="rep-title"
                      type="text"
                      value={reportDraft.title}
                      onChange={(e) =>
                        setReportDraft({ ...reportDraft, title: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="rep-cat" className="block text-slate-700 font-semibold mb-1">
                      Vulnerability Template
                    </label>
                    <select
                      id="rep-cat"
                      value={reportDraft.templateCategory}
                      onChange={(e) =>
                        setReportDraft({
                          ...reportDraft,
                          templateCategory: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      {REPORT_TEMPLATES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label htmlFor="rep-asset" className="block text-slate-700 font-semibold mb-1">
                      Affected Asset Within Authorized Scope
                    </label>
                    <input
                      id="rep-asset"
                      type="text"
                      value={reportDraft.affectedAssetInScope}
                      onChange={(e) =>
                        setReportDraft({
                          ...reportDraft,
                          affectedAssetInScope: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="rep-sev" className="block text-slate-700 font-semibold mb-1">
                      Technical Severity
                    </label>
                    <select
                      id="rep-sev"
                      value={reportDraft.technicalSeverity}
                      onChange={(e) =>
                        setReportDraft({
                          ...reportDraft,
                          technicalSeverity: e.target.value as VulnerabilityReportDraft['technicalSeverity'],
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="rep-steps" className="block text-slate-700 font-semibold mb-1">
                    Numbered Reproduction Steps (1., 2., 3...)
                  </label>
                  <textarea
                    id="rep-steps"
                    rows={4}
                    value={reportDraft.reproductionSteps}
                    onChange={(e) =>
                      setReportDraft({
                        ...reportDraft,
                        reproductionSteps: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rep-expected" className="block text-slate-700 font-semibold mb-1">
                      Expected Security Invariant Behavior
                    </label>
                    <textarea
                      id="rep-expected"
                      rows={2}
                      value={reportDraft.expectedBehavior}
                      onChange={(e) =>
                        setReportDraft({
                          ...reportDraft,
                          expectedBehavior: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="rep-actual" className="block text-slate-700 font-semibold mb-1">
                      Actual Observed Behavior
                    </label>
                    <textarea
                      id="rep-actual"
                      rows={2}
                      value={reportDraft.actualBehavior}
                      onChange={(e) =>
                        setReportDraft({
                          ...reportDraft,
                          actualBehavior: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rep-evidence" className="block text-slate-700 font-semibold mb-1">
                    Sanitized Request / Response Proof (Redact secrets with [REDACTED])
                  </label>
                  <textarea
                    id="rep-evidence"
                    rows={4}
                    value={reportDraft.sanitizedEvidence}
                    onChange={(e) =>
                      setReportDraft({
                        ...reportDraft,
                        sanitizedEvidence: e.target.value,
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rep-impact" className="block text-slate-700 font-semibold mb-1">
                      Demonstrated Impact Statement
                    </label>
                    <textarea
                      id="rep-impact"
                      rows={2}
                      value={reportDraft.demonstratedImpactLevel}
                      onChange={(e) =>
                        setReportDraft({
                          ...reportDraft,
                          demonstratedImpactLevel: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label htmlFor="rep-fp" className="block text-slate-700 font-semibold mb-1">
                      False-Positive & Benign-Explanation Exclusion
                    </label>
                    <textarea
                      id="rep-fp"
                      rows={2}
                      value={reportDraft.falsePositiveReview}
                      onChange={(e) =>
                        setReportDraft({
                          ...reportDraft,
                          falsePositiveReview: e.target.value,
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right 4 cols: Live 7-Point Triage Proof-Obligation Checklist */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sky-800 font-semibold">
                Proof-Obligation & Triage Audit
              </div>
              <span className="font-mono font-bold text-sm tabular-nums text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {reportQuality.readinessScore}% Ready
              </span>
            </div>

            <p className="text-slate-500 leading-relaxed">
              Verifies structural completeness and credential sanitization against professional triage standards before submission.
            </p>

            <div className="space-y-2.5">
              {reportQuality.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border space-y-1 ${
                    item.passed
                      ? 'border-emerald-200 bg-emerald-50/60 text-slate-800'
                      : 'border-rose-200 bg-rose-50/60 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{item.label}</span>
                    {item.passed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
