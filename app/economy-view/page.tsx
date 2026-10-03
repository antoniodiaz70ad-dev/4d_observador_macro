'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SolarSystem3D } from '@/components/economy/SolarSystem3D';
import { RevenueChart } from '@/components/economy/RevenueChart';
import { PredictionsPanel } from '@/components/economy/PredictionsPanel';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  RefreshCw, 
  DollarSign, 
  Activity, 
  Shield,
  Pause,
  Play,
  Radio,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  ExternalLink,
  BarChart2,
  Brain,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Economy View - Vista dedicada del Sistema Solar Leviathan
// Visualización 3D de la economía agéntica
// ═══════════════════════════════════════════════════════════════════════════

interface EconomyData {
  global: {
    totalBalance: number;
    totalRevenue: number;
    monthlyRevenue: number;
    systemHealth: number;
    projectCount: number;
    decisionsToday: number;
    revenueTrend: 'up' | 'down' | 'stable';
  };
  projects: Array<{
    id: string;
    name: string;
    totalRevenue: number;
    monthlyRevenue: number;
    balance: number;
    transactionsPerHour: number;
    agentMode: string;
    recentDecisionsCount: number;
  }>;
  recentDecisions: Array<{
    id: string;
    timestamp: string;
    projectName: string;
    actionLabel: string;
    revenue: number;
    outcome: string | null;
  }>;
}

export default function EconomyViewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [data, setData] = useState<EconomyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(true);
  const [showDecisionStream, setShowDecisionStream] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/live-economy');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching economy data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router, fetchData]);

  // Polling cada 5 segundos
  useEffect(() => {
    if (!isPolling) return;
    
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [isPolling, fetchData]);

  const handleEmergencyStop = async () => {
    if (confirm('⚠️ ¿PAUSAR TODOS los agentes?')) {
      await fetch('/api/agent/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EMERGENCY_STOP' })
      });
      fetchData();
    }
  };

  const handleResumeAll = async () => {
    await fetch('/api/agent/control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RESUME_ALL' })
    });
    fetchData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Cargando Sistema Solar...</p>
        </div>
      </div>
    );
  }

  const hasEconomyProjects = Boolean(data && data.projects.length > 0);
  const allPaused = data?.projects.every(p => p.agentMode === 'paused');

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Canvas del Sistema Solar - Ocupa toda la pantalla */}
      <div className="absolute inset-0">
        {data && data.projects.length > 0 ? (
          <SolarSystem3D
            projects={data.projects.map(p => ({
              id: p.id,
              name: p.name,
              totalRevenue: p.totalRevenue,
              monthlyRevenue: p.monthlyRevenue,
              balance: p.balance,
              transactionsPerHour: p.transactionsPerHour,
              agentMode: p.agentMode,
              decisionsCount: p.recentDecisionsCount,
            }))}
            globalMetrics={{
              totalBalance: data.global.totalBalance,
              totalRevenue: data.global.totalRevenue,
              systemHealth: data.global.systemHealth,
            }}
            recentDecisions={data.recentDecisions.slice(0, 5)}
            onProjectClick={(id) => console.log('Project clicked:', id)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 mx-auto mb-6 flex items-center justify-center">
                <span className="text-6xl">☀️</span>
              </div>
              <h2 className="text-2xl text-slate-300 mb-2">Sistema Solar Vacío</h2>
              <p className="text-slate-500 mb-6 max-w-md">
                No hay proyectos externos registrados.
                Crea proyectos en el Projects Hub para verlos orbitar.
              </p>
              <Button
                onClick={() => router.push('/projects-hub')}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                Ir a Projects Hub
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Header flotante */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="text-slate-400 hover:text-white bg-black/50 backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Economy View
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                {hasEconomyProjects && isPolling ? (
                  <>
                    <Radio className="h-3 w-3 text-green-400 animate-pulse" />
                    <span className="text-green-400">EN VIVO</span>
                  </>
                ) : hasEconomyProjects ? (
                  <span className="text-slate-500">Pausado</span>
                ) : (
                  <span className="text-yellow-400">SIN PROYECTOS CONECTADOS</span>
                )}
              </p>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPolling(!isPolling)}
              className="bg-black/50 backdrop-blur-sm"
            >
              {isPolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/projects-hub')}
              className="bg-black/50 backdrop-blur-sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Projects Hub
            </Button>

            {data && data.projects.length > 0 && (
              allPaused ? (
                <Button
                  onClick={handleResumeAll}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-4 w-4 mr-2" />
                  REANUDAR TODO
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleEmergencyStop}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  EMERGENCY STOP
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Métricas flotantes - Izquierda */}
      {data && (
        <div className="absolute left-4 top-24 space-y-3 z-10">
          <div className="bg-black/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3 min-w-[180px]">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-400">Balance Total</span>
            </div>
            <p className="text-xl font-bold text-green-400">
              {formatCurrency(data.global.totalBalance)}
            </p>
          </div>

          <div className="bg-black/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-slate-400">Este Mes</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-yellow-400">
                {formatCurrency(data.global.monthlyRevenue)}
              </p>
              {getTrendIcon(data.global.revenueTrend)}
            </div>
          </div>

          <div className="bg-black/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Decisiones Hoy</span>
            </div>
            <p className="text-xl font-bold text-cyan-400">
              {data.global.decisionsToday}
            </p>
          </div>

          <div className="bg-black/70 backdrop-blur-sm border border-slate-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-400">Salud Sistema</span>
            </div>
            <p className={`text-xl font-bold ${
              data.global.systemHealth > 70 ? 'text-green-400' :
              data.global.systemHealth > 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {data.global.systemHealth}%
            </p>
          </div>
        </div>
      )}

      {/* Stream de decisiones - Derecha */}
      {data && showDecisionStream && (
        <div className="absolute right-4 top-24 bottom-4 w-80 z-10">
          <div className="bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded-lg h-full flex flex-col">
            <div className="px-4 py-3 border-b border-cyan-500/20 flex items-center justify-between">
              <span className="text-sm font-mono text-cyan-400 flex items-center gap-2">
                <Radio className="h-4 w-4 animate-pulse" />
                STREAM
              </span>
              <button
                onClick={() => setShowDecisionStream(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {data.recentDecisions.slice(0, 30).map((decision) => (
                <div 
                  key={decision.id}
                  className={`text-xs p-2 rounded ${
                    decision.revenue > 0 
                      ? 'bg-green-500/10 border-l-2 border-green-500/50'
                      : 'bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-cyan-400 font-medium truncate">
                      {decision.projectName}
                    </span>
                    <span className="text-slate-500">
                      {formatTime(decision.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-300 truncate">
                    {decision.actionLabel}
                  </p>
                  {decision.revenue > 0 && (
                    <p className="text-green-400 font-mono mt-1">
                      +{formatCurrency(decision.revenue)}
                    </p>
                  )}
                </div>
              ))}
              
              {data.recentDecisions.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Esperando decisiones...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botón para mostrar stream si está oculto */}
      {!showDecisionStream && (
        <button
          onClick={() => setShowDecisionStream(true)}
          className="absolute right-4 top-24 bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-3 z-10"
        >
          <Radio className="h-5 w-5 text-cyan-400" />
        </button>
      )}

      {/* Panel lateral de Analytics */}
      <div className={`fixed top-0 right-0 h-full w-[500px] bg-slate-950/95 backdrop-blur-md border-l border-purple-500/30 z-40 transform transition-transform duration-300 ${showAnalytics ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-400" />
              Analytics & Predicciones
            </h2>
            <button 
              onClick={() => setShowAnalytics(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* Gráfica de Ingresos */}
          <RevenueChart />
          
          {/* Panel de Predicciones IA */}
          <PredictionsPanel />
        </div>
      </div>

      {/* Botón flotante para abrir Analytics */}
      {!showAnalytics && (
        <button
          onClick={() => setShowAnalytics(true)}
          className="fixed right-0 top-1/2 transform -translate-y-1/2 z-30 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-l-lg shadow-lg flex items-center gap-2 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
          <BarChart2 className="h-5 w-5" />
          <Brain className="h-5 w-5" />
        </button>
      )}

      {/* Footer con acciones rápidas */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-black/70 backdrop-blur-sm border border-slate-700/50 rounded-full px-6 py-2 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnalytics(true)}
            className={`${showAnalytics ? 'text-purple-400' : 'text-slate-400'} hover:text-white`}
          >
            <BarChart2 className="h-4 w-4 mr-1" />
            Analytics
          </Button>
          <div className="w-px h-6 bg-slate-700" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/tablero-3d')}
            className="text-slate-400 hover:text-white"
          >
            Tablero 3D
          </Button>
          <div className="w-px h-6 bg-slate-700" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white"
          >
            Dashboard
          </Button>
          <div className="w-px h-6 bg-slate-700" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects-hub')}
            className="text-slate-400 hover:text-white"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Projects Hub
          </Button>
        </div>
      </div>
    </div>
  );
}
