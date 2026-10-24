/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AcademyProvider, useAcademy } from './context/AcademyContext';
import { ResearchCycleBar } from './components/ResearchCycleBar';
import { DashboardView } from './components/DashboardView';
import { CurriculumView } from './components/CurriculumView';
import { LessonWorkspace } from './components/LessonWorkspace';
import { LabsAndHttpView } from './components/LabsAndHttpView';
import { CaseStudiesView, NotebookView } from './components/CaseStudiesAndNotebookView';
import { WorkbenchesView } from './components/WorkbenchesView';
import { ReviewAndMasteryView } from './components/ReviewAndMasteryView';
import { ReportingAndChainsView } from './components/ReportingAndChainsView';
import {
  CommandPaletteModal,
  DataAndSettingsView,
} from './components/SearchAndDataView';
import { ResearchCycleStep } from './types/domain';
import {
  BookOpen,
  Brain,
  Compass,
  Database,
  FileSpreadsheet,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Menu,
  NotebookPen,
  Search,
  Settings,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Command Centre', icon: LayoutDashboard },
  { id: 'curriculum', label: '26-Module Curriculum', icon: Compass },
  { id: 'lesson', label: 'Lesson Workspace', icon: BookOpen },
  { id: 'labs', label: 'Labs & HTTP Explorer', icon: FlaskConical },
  { id: 'cases', label: 'Case Studies', icon: FileSpreadsheet },
  { id: 'notebook', label: 'Research Notebook', icon: NotebookPen },
  { id: 'workbenches', label: 'Domain Workbenches', icon: Database },
  { id: 'review', label: 'Retrieval & Mastery', icon: Brain },
  { id: 'reporting', label: 'Chains & Report Studio', icon: GitBranch },
  { id: 'settings', label: 'Data & Settings', icon: Settings },
] as const;

function mapRouteToCycleStep(route: string): ResearchCycleStep {
  switch (route) {
    case 'curriculum':
    case 'lesson':
      return 'STUDY';
    case 'workbenches':
      return 'MODEL';
    case 'labs':
      return 'CONTROLLED_MUTATION';
    case 'cases':
      return 'VALIDATION';
    case 'notebook':
      return 'HYPOTHESIS';
    case 'reporting':
      return 'REPORT';
    case 'review':
      return 'NEW_HYPOTHESIS';
    default:
      return 'BASELINE';
  }
}

const AcademyShell: React.FC = () => {
  const {
    state,
    recoveryNotice,
    dismissRecoveryNotice,
    navigate,
    isIndexedDbReady,
    curriculumStructure,
  } = useAcademy();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-sky-500/20 selection:text-sky-900">
      {/* Strict 3-Zone Top Bar Contract - White Minimalist */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 py-2.5 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              navigate('dashboard');
            }}
            className="text-sm sm:text-base font-bold tracking-tight text-slate-900 truncate font-display flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 inline-block" />
            <span>Alex Security Research Academy</span>
          </a>
          <span className="hidden xl:inline text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 text-emerald-700">
            {isIndexedDbReady ? 'IndexedDB Active' : 'Local Persistence'}
          </span>
        </div>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Workspace Navigation"
          className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600"
        >
          <a
            href="#curriculum"
            onClick={(e) => {
              e.preventDefault();
              navigate('curriculum');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              state.activeRoute === 'curriculum'
                ? 'text-sky-700 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Curriculum
          </a>
          <a
            href="#lesson"
            onClick={(e) => {
              e.preventDefault();
              navigate('lesson');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              state.activeRoute === 'lesson'
                ? 'text-sky-700 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Lessons
          </a>
          <a
            href="#labs"
            onClick={(e) => {
              e.preventDefault();
              navigate('labs');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              state.activeRoute === 'labs'
                ? 'text-sky-700 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Protocol Labs
          </a>
          <a
            href="#notebook"
            onClick={(e) => {
              e.preventDefault();
              navigate('notebook');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              state.activeRoute === 'notebook'
                ? 'text-sky-700 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Notebook
          </a>
          <a
            href="#reporting"
            onClick={(e) => {
              e.preventDefault();
              navigate('reporting');
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
              state.activeRoute === 'reporting'
                ? 'text-sky-700 font-semibold underline underline-offset-8 decoration-2 decoration-sky-600'
                : ''
            }`}
          >
            Report Studio
          </a>
        </nav>

        {/* Zone 3: 1 primary action (Global Search / Command Palette) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="sm:hidden">Search</span>
            <span className="hidden sm:inline">Search & Commands (Ctrl+K)</span>
          </button>
        </div>
      </header>

      {/* Non-Negotiable 10-Stage Research Cycle Strip */}
      <ResearchCycleBar
        activeStep={mapRouteToCycleStep(state.activeRoute)}
        onNavigate={(r) => navigate(r)}
      />

      {recoveryNotice && (
        <div
          role="alert"
          className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center justify-between"
        >
          <span>{recoveryNotice}</span>
          <button
            type="button"
            onClick={dismissRecoveryNotice}
            className="underline font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Workspace Body: Sidebar + Main Viewport */}
      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Desktop Collapsible Sidebar */}
        <aside
          aria-label="Research Workspaces Sidebar"
          className={`hidden lg:flex flex-col justify-between border-r border-slate-200 bg-white shrink-0 transition-all ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <div className="p-3 space-y-1">
            <div className="flex items-center justify-between px-2 py-1.5 mb-1.5">
              {!sidebarCollapsed && (
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                  Workspaces
                </span>
              )}
              <button
                type="button"
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = state.activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => navigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-sky-50 text-sky-800 border border-sky-200 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-700' : 'text-slate-500'}`} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {!sidebarCollapsed && (
            <div className="p-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1 bg-slate-50/60">
              <div className="font-semibold text-slate-800">
                Bug Bounty Engineering
              </div>
              <div>Researcher Edition 2026</div>
              <div className="font-mono text-emerald-700 pt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>IndexedDB: 26 Modules Ready</span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Mobile Workspace Bar */}
          <div className="lg:hidden mb-4 flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-800 flex items-center gap-1.5 shadow-xs"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>All 10 Workspaces</span>
            </button>
            <span className="text-xs font-mono font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {NAV_ITEMS.find((i) => i.id === state.activeRoute)?.label}
            </span>
          </div>

          {mobileMenuOpen && (
            <nav
              aria-label="Mobile Workspace Drawer"
              className="lg:hidden mb-6 p-3 rounded-lg border border-slate-200 bg-white shadow-md grid grid-cols-2 gap-2"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = state.activeRoute === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2 rounded text-xs text-left ${
                      isActive
                        ? 'bg-sky-50 text-sky-800 font-semibold border border-sky-200'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Active Route Renderer */}
          {state.activeRoute === 'dashboard' && <DashboardView />}
          {state.activeRoute === 'curriculum' && <CurriculumView />}
          {state.activeRoute === 'lesson' && <LessonWorkspace />}
          {state.activeRoute === 'labs' && <LabsAndHttpView />}
          {state.activeRoute === 'cases' && <CaseStudiesView />}
          {state.activeRoute === 'notebook' && <NotebookView />}
          {state.activeRoute === 'workbenches' && <WorkbenchesView />}
          {state.activeRoute === 'review' && <ReviewAndMasteryView />}
          {state.activeRoute === 'reporting' && <ReportingAndChainsView />}
          {state.activeRoute === 'settings' && <DataAndSettingsView />}
        </main>
      </div>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            Alex Security Research Academy · Reference Textbook: Bug Bounty Engineering — Researcher Edition 2026
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('curriculum')}
              className="hover:text-slate-900 underline font-medium"
            >
              Source Content Inventory
            </button>
            <button
              type="button"
              onClick={() => navigate('settings')}
              className="hover:text-slate-900 underline font-medium"
            >
              Backup & Restore Progress
            </button>
          </div>
        </div>
      </footer>

      {/* Global Search & Command Palette Modal */}
      <CommandPaletteModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AcademyProvider>
      <AcademyShell />
    </AcademyProvider>
  );
}
