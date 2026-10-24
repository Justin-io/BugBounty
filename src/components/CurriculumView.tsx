import React, { useState } from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  LESSONS_CATALOG,
  SOURCE_INGESTION_NOTICE,
} from '../data/curriculumData';
import { evaluateModuleUnlockStatus } from '../utils/researchEngine';
import {
  BookOpen,
  CheckCircle2,
  FlaskConical,
  GitBranch,
  Lock,
  Search,
  Unlock,
  FileCheck2,
  ArrowRight,
  ShieldAlert,
  Flame,
  ChevronDown,
  ChevronUp,
  Database,
} from 'lucide-react';

const TRACK_FILTERS = [
  'All Tracks',
  'Foundations & Protocol Mechanics',
  'Identity, Access & State Logic',
  'Injection, Parser & Server Boundaries',
  'Modern APIs, Client & Runtime',
  'Cloud, Mobile, Supply Chain & AI',
  'Chaining, Tooling & Independent Research',
] as const;

export const CurriculumView: React.FC = () => {
  const {
    state,
    navigate,
    toggleSkipPrerequisiteOverride,
    curriculumStructure,
    isIndexedDbReady,
  } = useAcademy();

  const [selectedTrack, setSelectedTrack] = useState<string>('All Tracks');
  const [searchQuery, setSearchQuery] = useState('');
  const [subView, setSubView] = useState<'modules' | 'graph' | 'sources'>('modules');
  const [inspectedModuleId, setInspectedModuleId] = useState<string>('mod-01');
  const [expandedCveModuleId, setExpandedCveModuleId] = useState<string | null>('mod-01');
  const [expandedLabReqModuleId, setExpandedLabReqModuleId] = useState<string | null>(null);

  const modulesList = curriculumStructure.modules;

  const filteredModules = modulesList.filter((m) => {
    const matchesTrack =
      selectedTrack === 'All Tracks' || m.track === selectedTrack;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      m.title.toLowerCase().includes(q) ||
      m.coreConcepts.some((c) => c.toLowerCase().includes(q)) ||
      m.sourceReference.sectionCode.toLowerCase().includes(q);
    return matchesTrack && matchesSearch;
  });

  const inspectedModule =
    modulesList.find((m) => m.id === inspectedModuleId) ||
    modulesList[0];
  const inspectedUnlock = evaluateModuleUnlockStatus(
    inspectedModule,
    modulesList,
    state
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Sub-View Switcher - White Minimalist */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-sky-700 font-mono font-semibold uppercase tracking-wider flex items-center gap-2">
              <span>Bug Bounty Engineering — Researcher Edition 2026</span>
              <span className="text-slate-300">·</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Database className="w-3 h-3" />
                <span>26 Modules in IndexedDB</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 font-display tracking-tight">
              Curriculum Explorer & Prerequisite Knowledge Graph
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Navigate all 26 modules in linear recommended sequence or non-linear research mode, inspect prerequisite relations, audit real-world CVE case studies, and verify source textbook pagination.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={() => setSubView('modules')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 font-medium ${
                subView === 'modules'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>26 Modules ({modulesList.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubView('graph')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 font-medium ${
                subView === 'graph'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Prerequisite Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setSubView('sources')}
              className={`px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 font-medium ${
                subView === 'sources'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Source Index</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        {subView === 'modules' && (
          <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {TRACK_FILTERS.map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => setSelectedTrack(track)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap shrink-0 font-medium ${
                    selectedTrack === track
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Filter modules by title or concept"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules, concepts, or CVEs..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-600 focus:bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Subview 1: 26 Module Grid */}
      {subView === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredModules.map((mod) => {
            const unlock = evaluateModuleUnlockStatus(
              mod,
              modulesList,
              state
            );
            const moduleLessons = LESSONS_CATALOG.filter(
              (l) => l.moduleId === mod.id
            );
            const isMastered = mod.lessonIds.every((id) =>
              state.masteredLessonIds.includes(id)
            );
            const cveCases = mod.cveCaseStudies || [];
            const labReqs = mod.labRequirements || [];
            const isCveExpanded = expandedCveModuleId === mod.id;
            const isLabReqExpanded = expandedLabReqModuleId === mod.id;

            return (
              <article
                key={mod.id}
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-3">
                  {/* Unboxed Metadata Kicker */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="font-mono text-sky-700 font-bold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Module {String(mod.number).padStart(2, '0')}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span>{mod.track}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono tabular-nums">{mod.estimatedHours}h</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium text-slate-700">{mod.difficulty}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      {isMastered ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>MASTERED</span>
                        </span>
                      ) : unlock.isUnlocked ? (
                        <span className="text-slate-700 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          <Unlock className="w-3.5 h-3.5 text-sky-600" />
                          <span>
                            {unlock.isSkippedOverride ? 'OVERRIDE' : 'UNLOCKED'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-amber-800 font-medium flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>PREREQ LOCKED</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {mod.number}. {mod.title}
                    </h2>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {mod.sourceReference.sectionCode} · Printed {mod.sourceReference.printedPage} ({mod.sourceReference.pdfViewerPage})
                    </div>
                  </div>

                  {/* Core Concepts */}
                  <div className="text-xs space-y-1">
                    <div className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      Core Invariants & Concepts:
                    </div>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                      {mod.coreConcepts.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Real-World CVE Case Studies Accordion */}
                  {cveCases.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCveModuleId(isCveExpanded ? null : mod.id)
                        }
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-sky-700 py-1"
                      >
                        <span className="flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-600" />
                          <span>Real-World CVE Case Studies ({cveCases.length})</span>
                        </span>
                        {isCveExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {isCveExpanded && (
                        <div className="mt-2 space-y-2">
                          {cveCases.map((cve) => (
                            <div
                              key={cve.cveId}
                              className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between font-mono">
                                <span className="font-bold text-rose-700">{cve.cveId}</span>
                                <span className="text-slate-500">{cve.vulnerabilityClass}</span>
                              </div>
                              <div className="font-semibold text-slate-900">{cve.title}</div>
                              <div className="text-slate-600">
                                <strong className="text-slate-800">Root-Cause Invariant Failure:</strong> {cve.rootCauseInvariantBreak}
                              </div>
                              <div className="p-2 rounded bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto">
                                <code>{cve.mutationPayloadPreview}</code>
                              </div>
                              <div className="text-[11px] text-emerald-800 font-medium">
                                ✓ Defensive Fix: {cve.defensiveRemediation}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lab Requirements Accordion */}
                  {labReqs.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLabReqModuleId(isLabReqExpanded ? null : mod.id)
                        }
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-800 hover:text-sky-700 py-1"
                      >
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
                          <span>Lab Requirements & Proof Obligations ({labReqs.length})</span>
                        </span>
                        {isLabReqExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {isLabReqExpanded && (
                        <div className="mt-2 space-y-2">
                          {labReqs.map((req) => (
                            <div
                              key={req.id}
                              className="p-3 rounded-lg bg-sky-50/50 border border-sky-200 text-xs space-y-1"
                            >
                              <div className="font-semibold text-sky-900">{req.title}</div>
                              <div className="text-slate-700">
                                <strong className="text-slate-900">Target Invariant:</strong> {req.targetSecurityInvariant}
                              </div>
                              <div className="text-slate-600 text-[11px]">
                                <strong>Proof Obligation:</strong> {req.proofObligationDescription}
                              </div>
                              <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-slate-500">
                                <span>Mutations: {req.controlledMutationsCount}</span>
                                <span>·</span>
                                <span>Min Confidence: {req.minimumConfidenceScore}%</span>
                                <span>·</span>
                                <span>Artifact: {req.expectedArtifactType}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prerequisites & Cross-References */}
                  <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5">
                    <div>
                      <span className="text-slate-500 font-medium">Prerequisites: </span>
                      {mod.prerequisites.length === 0 ? (
                        <span className="text-emerald-700 font-medium">None (Entry Module)</span>
                      ) : (
                        <span className="font-mono text-slate-800">
                          {mod.prerequisites.map((p) => p.toUpperCase()).join(', ')}
                        </span>
                      )}
                    </div>

                    {!unlock.isUnlocked && (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Locked: Complete{' '}
                          <strong className="font-mono">
                            {unlock.missingPrerequisiteIds.join(', ').toUpperCase()}
                          </strong>{' '}
                          first, or enable researcher override.
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleSkipPrerequisiteOverride(mod.id)}
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-md text-[11px] font-semibold whitespace-nowrap shrink-0 shadow-2xs"
                        >
                          Skip Prerequisite (Override)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {moduleLessons.map((les) => (
                      <button
                        key={les.id}
                        type="button"
                        onClick={() =>
                          navigate('lesson', {
                            moduleId: mod.id,
                            lessonId: les.id,
                          })
                        }
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                        <span>
                          Lesson {mod.number}.{les.orderInModule}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {mod.labIds[0] && (
                      <button
                        type="button"
                        onClick={() => navigate('labs', { labId: mod.labIds[0] })}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-medium rounded-md text-xs flex items-center gap-1 whitespace-nowrap shrink-0 shadow-2xs"
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
                        <span>Lab</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedModuleId(mod.id);
                        setSubView('graph');
                      }}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs font-medium whitespace-nowrap shrink-0"
                    >
                      Graph Node
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Subview 2: Interactive Prerequisite & Attack-Surface Knowledge Graph */}
      {subView === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Interactive Curriculum & Attack-Surface Dependency Graph
              </h2>
              <p className="text-xs text-slate-500">
                Click any module node to inspect upstream prerequisites, downstream unlocked capabilities, and cross-domain attack links.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {modulesList.map((m) => {
                const isSelected = m.id === inspectedModule.id;
                const isUpstream = inspectedModule.prerequisites.includes(m.id);
                const isDownstream = inspectedUnlock.dependentModuleIds.includes(m.id);
                const isCrossRef = inspectedModule.crossReferences.some(
                  (cr) => cr.targetModuleId === m.id
                );

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setInspectedModuleId(m.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold shadow-xs'
                        : isUpstream
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : isDownstream
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                        : isCrossRef
                        ? 'border-purple-300 bg-purple-50 text-purple-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold">M{String(m.number).padStart(2, '0')}</span>
                      {isSelected && <span className="text-sky-700 font-bold">SELECTED</span>}
                      {isUpstream && <span className="text-amber-800 font-medium">PREREQ</span>}
                      {isDownstream && <span className="text-emerald-800 font-medium">UNLOCKS</span>}
                      {isCrossRef && !isDownstream && (
                        <span className="text-purple-800 font-medium">LINKED</span>
                      )}
                    </div>
                    <div className="text-xs font-semibold mt-1 truncate">
                      {m.shortTitle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 5 cols: Node Dependency Inspector */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <div className="text-xs font-mono text-sky-700 font-semibold uppercase tracking-wider">
                  Graph Node Inspector · Module {String(inspectedModule.number).padStart(2, '0')}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {inspectedModule.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Track: {inspectedModule.track} · {inspectedModule.difficulty}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-2">
                <div className="font-semibold text-amber-900">
                  Upstream Prerequisites (Required Before This Module):
                </div>
                {inspectedModule.prerequisites.length === 0 ? (
                  <p className="text-amber-800">
                    Entry-level foundation module — no prior prerequisites required.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {inspectedModule.prerequisites.map((pid) => {
                      const pm = modulesList.find((x) => x.id === pid);
                      return (
                        <li key={pid} className="flex items-center justify-between">
                          <span className="text-amber-950 font-medium">
                            M{pm?.number}: {pm?.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedModuleId(pid)}
                            className="text-sky-700 hover:underline font-mono font-semibold"
                          >
                            Inspect
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="font-semibold text-emerald-900">
                  Downstream Dependent Modules (Unlocked By This Module):
                </div>
                {inspectedUnlock.dependentModuleIds.length === 0 ? (
                  <p className="text-emerald-800">
                    Terminal specialization module.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {inspectedUnlock.dependentModuleIds.map((did) => {
                      const dm = modulesList.find((x) => x.id === did);
                      return (
                        <li key={did} className="flex items-center justify-between">
                          <span className="text-emerald-950 font-medium">
                            M{dm?.number}: {dm?.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => setInspectedModuleId(did)}
                            className="text-sky-700 hover:underline font-mono font-semibold"
                          >
                            Inspect
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 text-xs space-y-2">
                <div className="font-semibold text-purple-900">
                  Verified Cross-Domain Attack Surface Links:
                </div>
                {inspectedModule.crossReferences.map((cr, idx) => {
                  const tm = modulesList.find(
                    (x) => x.id === cr.targetModuleId
                  );
                  return (
                    <div key={idx} className="text-purple-950">
                      <span className="font-mono font-bold text-purple-800">
                        → M{tm?.number} ({tm?.shortTitle}):
                      </span>{' '}
                      {cr.relationship}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate('lesson', {
                    moduleId: inspectedModule.id,
                    lessonId: inspectedModule.lessonIds[0],
                  })
                }
                className="flex-1 py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-md text-center shadow-xs"
              >
                Open Module {inspectedModule.number} Lesson Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subview 3: Source Attribution & Page Reference Inventory */}
      {subView === 'sources' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="font-bold text-slate-900">
              Source Verification & Pagination Disclosure ({SOURCE_INGESTION_NOTICE.documentTitle})
            </div>
            <p className="text-slate-600">{SOURCE_INGESTION_NOTICE.ingestionStatus}</p>
            <p className="text-slate-500 font-mono">
              {SOURCE_INGESTION_NOTICE.printedToPdfOffsetNote}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-2.5 pr-4">Mod</th>
                  <th className="py-2.5 px-4">Module Title</th>
                  <th className="py-2.5 px-4">Section Reference</th>
                  <th className="py-2.5 px-4">Printed Page</th>
                  <th className="py-2.5 px-4">PDF Viewer Position</th>
                  <th className="py-2.5 pl-4">Source Provenance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {modulesList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-sky-700 font-bold">
                      M{String(m.number).padStart(2, '0')}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {m.title}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">
                      {m.sourceReference.sectionCode}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-700">
                      {m.sourceReference.printedPage}
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500">
                      {m.sourceReference.pdfViewerPage}
                    </td>
                    <td className="py-2.5 pl-4 text-emerald-700 font-mono font-medium">
                      {m.sourceReference.verificationStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
