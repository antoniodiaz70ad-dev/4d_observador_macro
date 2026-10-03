
'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Eye,
  LogOut,
  Menu,
  Home,
  Target,
  Users,
  Zap,
  Sparkles,
  Brain,
  Calendar,
  Settings,
  BookOpen,
  Box,
  Maximize2,
  Crosshair,
  Globe,
  Orbit,
  DollarSign,
  ExternalLink,
  History,
  ArrowRight,
  CheckCircle2,
  ListChecks,
  Compass,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { CoherenceMeters } from './coherence-meters';
import { TimelineViewer } from './timeline-viewer';
import { ProjectsPanel } from './projects-panel';
import { EnergyFlows } from './energy-flows';
import { RelationshipsMap } from './relationships-map';
import { SynchronicityTracker } from './synchronicity-tracker';
import { AIAnalysis } from './ai-analysis';
import GameBoard from './game-board';
import { DecisionMode } from './DecisionMode';
import { NodeEvolution } from './NodeEvolution';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { AgentCommandCenter } from './AgentCommandCenter';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function DashboardContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [gameBoardData, setGameBoardData] = useState({
    projects: [],
    relationships: [],
    manifestations: [],
    entries: [],
  });
  const [showDecisionMode, setShowDecisionMode] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  // Verificar estado del onboarding
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const focus = params.get('focus');
    if (!focus) return;

    const targetByFocus: Record<string, string> = {
      projects: 'projects-panel',
      relationships: 'relationships-map',
      timeline: 'timeline-viewer',
    };

    const target = targetByFocus[focus];
    if (!target) return;

    const timer = window.setTimeout(() => {
      scrollToSection(target);
      window.history.replaceState(null, '', '/dashboard');
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/user/onboarding');
        if (response.ok) {
          const data = await response.json();
          const dismissed = typeof window !== 'undefined' && localStorage.getItem('observador4d:onboarding-dismissed') === 'true';
          if (!data.onboarding?.completed && !dismissed) {
            setShowOnboarding(true);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding:', error);
      } finally {
        setOnboardingChecked(true);
      }
    };

    if (session) {
      checkOnboarding();
    }
  }, [session]);

  // Cargar datos para el tablero de juego
  useEffect(() => {
    const fetchGameBoardData = async () => {
      try {
        const [projectsRes, relationshipsRes, manifestationsRes, entriesRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/relationships'),
          fetch('/api/dashboard/manifestations'),
          fetch('/api/daily-mapping/entries?limit=10'),
        ]);

        const projects = projectsRes.ok ? await projectsRes.json() : [];
        const relationships = relationshipsRes.ok ? await relationshipsRes.json() : [];
        const manifestations = manifestationsRes.ok ? await manifestationsRes.json() : [];
        const entries = entriesRes.ok ? await entriesRes.json() : [];

        setGameBoardData({ projects, relationships, manifestations, entries });
      } catch (error) {
        console.error('Error loading game board data:', error);
      }
    };

    if (session) {
      fetchGameBoardData();
    }
  }, [session]);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleNewProject = () => {
    // Scroll to projects panel and trigger the add button click
    const projectsPanel = document.querySelector('[data-testid="projects-panel"]');
    if (projectsPanel) {
      projectsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Wait for scroll to complete, then click the + button
      setTimeout(() => {
        const addButton = projectsPanel.querySelector('button[aria-label="Agregar proyecto"]');
        if (addButton) {
          (addButton as HTMLButtonElement).click();
        }
      }, 500);
    }
  };

  const handleNewSynchronicity = () => {
    // Scroll to synchronicity tracker
    const syncPanel = document.querySelector('[data-testid="sync-tracker"]');
    if (syncPanel) {
      syncPanel.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNewRelationship = () => {
    // Scroll to relationships map and open the add form when available
    const relPanel = document.querySelector('[data-testid="relationships-map"]');
    if (relPanel) {
      relPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const addButton = relPanel.querySelector('button[aria-label="Agregar relación"]');
        if (addButton) {
          (addButton as HTMLButtonElement).click();
        }
      }, 500);
    }
  };

  const handleAIAnalysis = () => {
    // Scroll to AI analysis panel
    const aiPanel = document.querySelector('[data-testid="ai-analysis"]');
    if (aiPanel) {
      aiPanel.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (testId: string) => {
    const element = document.querySelector(`[data-testid="${testId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false); // Close mobile sidebar after navigation
    }
  };

  const hasProjects = gameBoardData.projects.length > 0;
  const hasRelationships = gameBoardData.relationships.length > 0;
  const hasEntries = gameBoardData.entries.length > 0;
  const setupSteps = [
    {
      label: 'Primer proyecto',
      done: hasProjects,
      description: 'Define el objetivo que quieres observar.',
      action: handleNewProject,
      actionLabel: 'Crear proyecto',
      icon: Target,
      accent: 'cyan'
    },
    {
      label: 'Primera relación',
      done: hasRelationships,
      description: 'Conecta a una persona o aliado clave.',
      action: handleNewRelationship,
      actionLabel: 'Agregar relación',
      icon: Users,
      accent: 'pink'
    },
    {
      label: 'Registro de hoy',
      done: hasEntries,
      description: 'Completa una captura breve de tu día.',
      action: () => router.push('/daily-mapping'),
      actionLabel: 'Completar mi registro de hoy',
      icon: Calendar,
      accent: 'violet'
    }
  ];
  const setupProgress = setupSteps.filter(step => step.done).length;
  const nextStep = setupSteps.find(step => !step.done) || {
    label: 'Leer el patrón completo',
    description: 'Ya tienes base para analizar tu mapa con Memory 4D.',
    action: () => router.push('/memoria-4d'),
    actionLabel: 'Abrir Memory 4D',
    icon: History,
    accent: 'emerald',
    done: false
  };
  const NextStepIcon = nextStep.icon;
  const hasMinimumSignals = hasProjects && hasRelationships && hasEntries;
  const missingSignals = setupSteps.filter(step => !step.done).map(step => step.label.toLowerCase());
  const simpleActions = [
    { label: 'Completar mi registro de hoy', description: 'Captura breve: cómo estás, qué pasó y qué decisión tomaste.', icon: Calendar, action: () => router.push('/daily-mapping') },
    { label: 'Ver proyectos activos', description: 'Revisa en qué estás invirtiendo energía.', icon: Target, action: () => scrollToSection('projects-panel') },
    { label: 'Ver cambios recientes', description: 'Consulta historial y evolución del mapa.', icon: History, action: () => scrollToSection('timeline-viewer') },
  ];
  const explorerActions = [
    { label: 'Historial — Memory 4D', description: 'Compara tu mapa con memoria y patrones.', icon: Brain, action: () => router.push('/memoria-4d') },
    { label: 'Mapa visual — Tablero 3D', description: 'Explora nodos y relaciones en vista espacial.', icon: Box, action: () => router.push('/tablero-3d') },
    { label: 'Decisiones — Modo Decisión', description: hasMinimumSignals ? 'Analiza una decisión con señales reales.' : 'Se habilita con proyecto, relación y registro diario.', icon: Crosshair, action: () => setShowDecisionMode(true) },
    { label: 'Integraciones — Projects Hub', description: 'Conecta y organiza fuentes de trabajo.', icon: Globe, action: () => router.push('/projects-hub') },
  ];

  const navigationItems = [
    { name: 'Vista General', icon: Home, action: () => window.scrollTo({ top: 0, behavior: 'smooth' }), current: true },
    { name: 'Decisiones — Modo Decisión', icon: Crosshair, action: () => setShowDecisionMode(true), current: false, highlight: true, badge: 'CEO' },
    { name: 'Economía — Economy View', icon: Orbit, action: () => router.push('/economy-view'), current: false, highlight: true, badge: '💰' },
    { name: 'Integraciones — Projects Hub', icon: Globe, action: () => router.push('/projects-hub'), current: false, highlight: true, badge: 'API' },
    { name: 'Mapa visual — Tablero 3D', icon: Box, action: () => router.push('/tablero-3d'), current: false, highlight: true, badge: '3D' },
    { name: 'Historial — Memory 4D', icon: History, action: () => router.push('/memoria-4d'), current: false, highlight: true, badge: 'MEM' },
    { name: 'Geometría — Wolcoff', icon: Sparkles, action: () => router.push('/wolcoff'), current: false, highlight: true, badge: 'NEW' },
    { name: 'Proyectos', icon: Target, action: () => scrollToSection('projects-panel'), current: false },
    { name: 'Relaciones', icon: Users, action: () => scrollToSection('relationships-map'), current: false },
    { name: 'Timeline', icon: Calendar, action: () => scrollToSection('timeline-viewer'), current: false },
    { name: 'Energía', icon: Zap, action: () => scrollToSection('energy-flows'), current: false },
    { name: 'Sincronicidades', icon: Sparkles, action: () => scrollToSection('sync-tracker'), current: false },
    { name: 'Configuración', icon: Settings, action: () => router.push('/dashboard'), current: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-purple-900/20 overflow-x-hidden">
      {/* Onboarding Wizard */}
      {showOnboarding && onboardingChecked && (
        <OnboardingWizard 
          onComplete={() => {
            setShowOnboarding(false);
            router.push('/tablero-3d');
          }}
          onSkip={() => {
            localStorage.setItem('observador4d:onboarding-dismissed', 'true');
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Modal de Modo Decisión */}
      {showDecisionMode && (
        <DecisionMode onClose={() => setShowDecisionMode(false)} />
      )}
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on all screens */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-sm border-r border-purple-500/20 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-200 ease-in-out lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center gap-3 p-6 border-b border-purple-500/20">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                OBSERVADOR
              </h1>
              <p className="text-sm text-cyan-300">4D</p>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {session?.user?.name || 'Usuario'}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.name}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  item.current 
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-300 border border-purple-500/30' 
                    : (item as any).highlight
                    ? 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 text-white border border-cyan-500/50 hover:from-cyan-500/40 hover:to-purple-500/40 shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.name}</span>
                {(item as any).badge && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border ${
                    (item as any).badge === 'CEO' 
                      ? 'bg-orange-500/30 border-orange-500/50 text-orange-300'
                      : (item as any).badge === 'NEW'
                      ? 'bg-green-500/30 border-green-500/50 text-green-300'
                      : 'bg-cyan-500/30 border-cyan-500/50 text-cyan-300'
                  }`}>
                    {(item as any).badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-slate-700/50">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 lg:ml-64">
        {/* Top Header */}
        <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-slate-400"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Dashboard 4D
                </h1>
                <p className="text-slate-400 text-sm">
                  Qué hacer hoy, qué cambió y de dónde salen tus resultados
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-200">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-slate-400">
                  Observador Activo
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {session?.user?.name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <main className="p-4 lg:p-6 overflow-x-hidden">
          <div className="w-full max-w-full">
            <Card data-testid="today-guidance" className="mb-6 overflow-hidden border-cyan-500/30 bg-gradient-to-br from-slate-900/95 via-purple-950/40 to-cyan-950/30 backdrop-blur-sm shadow-2xl shadow-cyan-950/20">
              <CardContent className="p-5 lg:p-6">
                <div className="grid gap-5 xl:grid-cols-[1fr_0.75fr]">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">
                      <ListChecks className="h-3.5 w-3.5" />
                      Hoy
                    </div>
                    <h2 className="text-2xl font-bold text-white lg:text-3xl">
                      Completa tu día y revisa lo importante
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                      El objetivo es simple: registra tu día, mira tus proyectos activos y revisa si algo cambió. Los mapas y módulos avanzados quedan en Explorar.
                    </p>

                    <div className="mt-5 rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">Acción principal</p>
                          <h3 className="mt-1 text-xl font-bold text-white">Completar mi registro de hoy</h3>
                          <p className="mt-2 text-sm leading-relaxed text-slate-300">
                            Captura cómo estás, qué pasó y qué decisión o señal vale la pena recordar.
                          </p>
                        </div>
                        <Button onClick={() => router.push('/daily-mapping')} className="bg-gradient-to-r from-cyan-600 to-purple-600 px-5 hover:from-cyan-500 hover:to-purple-500">
                          Completar mi registro de hoy
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {simpleActions.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={item.action}
                            className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-slate-800/80"
                          >
                            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-cyan-200">
                              <ItemIcon className="h-5 w-5" />
                            </div>
                            <p className="font-semibold text-slate-100">{item.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 rounded-2xl border border-purple-500/30 bg-purple-950/10 p-4">
                      <button
                        type="button"
                        onClick={() => setShowExplorer(!showExplorer)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-100">
                          <Sparkles className="h-4 w-4" />
                          Explorar mapas, geometría e integraciones
                        </div>
                        {showExplorer ? <ChevronUp className="h-4 w-4 text-purple-200" /> : <ChevronDown className="h-4 w-4 text-purple-200" />}
                      </button>
                      {showExplorer && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {explorerActions.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <button
                                key={item.label}
                                type="button"
                                onClick={item.action}
                                className="rounded-xl border border-purple-500/20 bg-slate-900/50 p-3 text-left transition hover:border-purple-300/50 hover:bg-purple-950/30"
                              >
                                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-100">
                                  <ItemIcon className="h-4 w-4 text-purple-300" />
                                  {item.label}
                                </div>
                                <p className="text-xs leading-relaxed text-slate-400">{item.description}</p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-purple-400/30 bg-black/30 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/20">
                        <NextStepIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-purple-200">Siguiente paso</p>
                        <h3 className="text-lg font-bold text-white">{nextStep.label}</h3>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">{nextStep.description}</p>
                    <div className="mt-5 rounded-full bg-slate-800/80 p-1">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all"
                        style={{ width: `${Math.max(12, (setupProgress / setupSteps.length) * 100)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">Base del mapa: {setupProgress}/{setupSteps.length} señales listas</p>

                    <div className="mt-4 rounded-2xl border border-slate-700/70 bg-slate-950/50 p-4">
                      <p className="text-sm font-semibold text-slate-100">Qué significan tus indicadores</p>
                      {hasMinimumSignals ? (
                        <p className="mt-2 text-xs leading-relaxed text-emerald-200">
                          Ya puedes usar Coherencia y Modo Decisión. Coherencia compara emoción, lógica y energía; energía representa dónde estás poniendo atención y recursos.
                        </p>
                      ) : (
                        <p className="mt-2 text-xs leading-relaxed text-slate-400">
                          Te falta {missingSignals.join(', ')} para activar Coherencia y Modo Decisión. Los flujos ya usan los proyectos y relaciones que tengas registrados.
                        </p>
                      )}
                    </div>

                    <div className="mt-5 grid gap-2">
                      <Button onClick={nextStep.action} className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500">
                        {nextStep.actionLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tablero de Juego 4D - Visión Aérea Principal */}
            <div className="mb-6" data-testid="game-board">
              <div className="mb-4 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">
                  <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Tablero 4D: Visión Macro
                  </span>
                </h2>
                <p className="text-slate-400 text-sm">
                  Perspectiva aérea de tu realidad dimensional - Observa desde arriba
                </p>
              </div>
              
              {/* Botones prominentes: Modo Decisión y Tablero 3D */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Modo Decisión - CEO */}
                <Card className="bg-gradient-to-r from-orange-500/10 via-red-500/10 to-yellow-500/10 border-2 border-orange-500/50 backdrop-blur-sm overflow-hidden relative hover:border-orange-400/70 transition-colors cursor-pointer group"
                  onClick={() => setShowDecisionMode(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-yellow-500/5 group-hover:opacity-75 transition-opacity"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                        <Crosshair className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-orange-300 to-yellow-300 bg-clip-text text-transparent">
                            Modo Decisión
                          </h3>
                          <span className="text-xs bg-orange-500/30 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/50">
                            CEO
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">
                          Resumen ejecutivo en 5 minutos
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/30 border-0"
                      >
                        Abrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Tablero 3D */}
                <Card className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border-2 border-cyan-500/50 backdrop-blur-sm overflow-hidden relative hover:border-cyan-400/70 transition-colors cursor-pointer group"
                  onClick={() => router.push('/tablero-3d')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 group-hover:opacity-75 transition-opacity"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/50">
                        <Box className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                            Tablero 3D Cuántico
                          </h3>
                          <span className="text-xs bg-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/50">
                            3D
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm">
                          Visualización geométrica dimensional
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg shadow-cyan-500/30 border-0"
                      >
                        <Maximize2 className="mr-1 h-4 w-4" />
                        Abrir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <GameBoard recentData={gameBoardData} />
            </div>

            {/* Agent Command Center - Economía Agéntica */}
            <div className="mb-6" data-testid="agent-command-center">
              <AgentCommandCenter />
            </div>

            {/* Métricas de Coherencia - Estado Actual */}
            <div className="mb-8">
              <CoherenceMeters />
            </div>

            {/* Secciones Full Width - Una debajo de otra */}
            <div className="space-y-6 mb-8">
              {/* Timeline */}
              <div data-testid="timeline-viewer" className="w-full">
                <TimelineViewer />
              </div>

              {/* Evolución de Nodos */}
              <div data-testid="node-evolution" className="w-full">
                <NodeEvolution />
              </div>

              {/* Proyectos */}
              <div data-testid="projects-panel" className="w-full">
                <ProjectsPanel />
              </div>

              {/* Flujos de Energía */}
              <div data-testid="energy-flows" className="w-full">
                <EnergyFlows />
              </div>

              {/* Sincronicidades */}
              <div data-testid="sync-tracker" className="w-full">
                <SynchronicityTracker />
              </div>

              {/* Relaciones */}
              <div data-testid="relationships-map" className="w-full">
                <RelationshipsMap />
              </div>
            </div>

            {/* Análisis IA - Ancho Completo */}
            <div className="mt-8" data-testid="ai-analysis">
              <AIAnalysis />
            </div>

            {/* Panel de Acciones Rápidas */}
            <Card className="mt-8 bg-gradient-to-r from-slate-900/50 to-purple-900/20 border-purple-500/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-200 text-center">
                  Acciones Rápidas 4D
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20"
                    onClick={() => router.push('/daily-mapping')}
                  >
                    <BookOpen className="h-6 w-6" />
                    <span className="text-sm">Mapeo Diario</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                    onClick={handleNewProject}
                  >
                    <Target className="h-6 w-6" />
                    <span className="text-sm">Nuevo Proyecto</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                    onClick={handleNewSynchronicity}
                  >
                    <Sparkles className="h-6 w-6" />
                    <span className="text-sm">Registrar Sincronicidad</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20"
                    onClick={handleNewRelationship}
                  >
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Agregar Relación</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 border-violet-500/30 text-violet-300 hover:bg-violet-500/20"
                    onClick={handleAIAnalysis}
                  >
                    <Brain className="h-6 w-6" />
                    <span className="text-sm">Análisis IA</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
