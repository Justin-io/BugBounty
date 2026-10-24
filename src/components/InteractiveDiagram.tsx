import React, { useState } from 'react';
import { DiagramNode, InteractiveDiagramSpec } from '../types/domain';
import { ChevronLeft, ChevronRight, RotateCcw, ShieldAlert, Layers, Table } from 'lucide-react';

export const InteractiveDiagram: React.FC<{
  diagram: InteractiveDiagramSpec;
}> = ({ diagram }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(
    diagram.nodes[0]?.id || ''
  );
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'table'>('interactive');

  const selectedNode: DiagramNode | undefined =
    diagram.nodes.find((n) => n.id === selectedNodeId) || diagram.nodes[0];
  const currentStep = diagram.steps[activeStepIdx] || diagram.steps[0];

  const handleReset = () => {
    setSelectedNodeId(diagram.nodes[0]?.id || '');
    setActiveStepIdx(0);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-sky-700 font-mono font-semibold uppercase tracking-wider">
            Interactive Protocol & Boundary Model
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">
            {diagram.title}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{diagram.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('interactive')}
              className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1 font-medium ${
                viewMode === 'interactive'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Topology</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1 font-medium ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Accessible Matrix</span>
            </button>
          </div>
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset diagram state"
            className="px-2.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-300 font-medium rounded-md flex items-center gap-1 whitespace-nowrap shrink-0 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {viewMode === 'interactive' ? (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left 7 cols: Interactive Node Pipeline + Step-Through Controls */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div>
              <div className="text-xs text-slate-500 mb-3 flex items-center justify-between font-medium">
                <span>Click any node to inspect trust assumptions:</span>
                <span className="font-mono text-slate-600 tabular-nums font-semibold">
                  {diagram.nodes.length} Components
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {diagram.nodes.map((node, idx) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isStepSource = currentStep?.fromNodeId === node.id;
                  const isStepTarget = currentStep?.toNodeId === node.id;

                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`text-left p-3 rounded-lg border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-sky-600 bg-sky-50 shadow-xs'
                          : isStepSource || isStepTarget
                          ? 'border-amber-300 bg-amber-50/60'
                          : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-medium">
                          <span>0{idx + 1} · {node.category.toUpperCase()}</span>
                          {isStepSource && (
                            <span className="text-sky-700 font-bold">SOURCE</span>
                          )}
                          {isStepTarget && (
                            <span className="text-amber-800 font-bold">TARGET</span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-1">
                          {node.label}
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 line-clamp-2">
                        {node.role}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sequence Step-Through Controller */}
            {diagram.steps.length > 0 && currentStep && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="text-xs font-bold text-slate-800">
                    Protocol Sequence Step {activeStepIdx + 1} of {diagram.steps.length}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={activeStepIdx === 0}
                      onClick={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap shrink-0 shadow-2xs font-medium"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      type="button"
                      disabled={activeStepIdx >= diagram.steps.length - 1}
                      onClick={() =>
                        setActiveStepIdx((i) =>
                          Math.min(diagram.steps.length - 1, i + 1)
                        )
                      }
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 flex items-center gap-1 whitespace-nowrap shrink-0 shadow-2xs font-medium"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2 text-xs shadow-2xs">
                  <div className="font-mono text-sky-800 font-semibold break-all">
                    {currentStep.protocolAction}
                  </div>
                  <pre className="p-2.5 rounded bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto shadow-inner">
                    {currentStep.payloadPreview}
                  </pre>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-500 font-medium">Invariant Check: </span>
                      <span className="text-slate-800">{currentStep.invariantCheck}</span>
                    </div>
                    <div>
                      <span className="text-amber-800 font-bold">Failure Mode: </span>
                      <span className="text-slate-700">{currentStep.failureCondition}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right 5 cols: Selected Component Inspector */}
          {selectedNode && (
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-3 shadow-xs">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-mono text-sky-700 font-semibold uppercase tracking-wider">
                    Component Inspector · {selectedNode.category.toUpperCase()}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedNode.label}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">{selectedNode.role}</p>
                </div>

                <div className="text-xs space-y-1.5">
                  <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Trust Assumptions:</div>
                  <ul className="list-disc list-inside text-slate-700 space-y-1">
                    {selectedNode.assumptions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-medium">Inputs</div>
                    <div className="text-slate-800 font-mono mt-1 text-[11px] font-semibold">
                      {selectedNode.inputs.join(', ')}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 font-medium">Outputs</div>
                    <div className="text-slate-800 font-mono mt-1 text-[11px] font-semibold">
                      {selectedNode.outputs.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>Required Security Invariant</span>
                </div>
                <p className="text-xs text-emerald-950 mt-1 font-medium">
                  {selectedNode.securityInvariant}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2.5 pr-4">Component</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Role & Assumptions</th>
                <th className="py-2.5 pl-4">Required Security Invariant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {diagram.nodes.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 pr-4 font-bold text-slate-900">{n.label}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">{n.category}</td>
                  <td className="py-2.5 px-4 text-slate-700">{n.role}</td>
                  <td className="py-2.5 pl-4 text-emerald-700 font-medium">{n.securityInvariant}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
