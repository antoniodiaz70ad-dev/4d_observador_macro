'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  AlertTriangle, 
  DollarSign, 
  Zap, 
  Pause, 
  Play, 
  RefreshCw, 
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
  CircleDot,
  Bot
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Agent Command Center - Panel de control para agentes de IA
// Monitoreo en tiempo real de Legal Shield, Capital Miner, etc.
// ═══════════════════════════════════════════════════════════════════════════

interface AgentDecision {
  id: string;
  timestamp: string;
  projectName: string;
  agentName: string;
  actionLabel: string;
  contextType: string;
  outcome: string | null;
  revenue: number;
  riskLevel: number | null;
  coherenceImpact: number | null;
}

interface ProjectData {
  id: string;
  name: string;
  balance: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeAgents: number;
  agentMode: string;
  transactionsPerHour: number;
}

interface EconomyData {
  global: {
    totalBalance: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalActiveAgents: number;
    systemHealth: number;
    projectCount: number;
    decisionsToday: number;
    revenueTrend: 'up' | 'down' | 'stable';
  };
  recentDecisions: AgentDecision[];
  projects: ProjectData[];
  alerts: Array<{
    type: string;
    message: string;
    projectId?: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
  lastUpdate: string;
}

export function AgentCommandCenter() {
  const [data, setData] = useState<EconomyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/live-economy');
      if (res.ok) {
        const result = await res.json();
        setData(result);
        setError(null);
        setLastFetch(new Date());
      } else {
        const err = await res.json();
        setError(err.error || 'Error al cargar datos');
      }
    } catch (err) {
      setError('Error de conexión');
      console.error('Error fetching economy data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling cada 5 segundos
  useEffect(() => {
    fetchData();
    
    if (isPolling) {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [isPolling, fetchData]);

  const handleEmergencyStop = async () => {
    if (confirm('⚠️ ¿PAUSAR TODOS los agentes de IA?\n\nEsta acción detendrá todas las operaciones automáticas.')) {
      try {
        const res = await fetch('/api/agent/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'EMERGENCY_STOP' })
        });
        
        if (res.ok) {
          fetchData(); // Refrescar datos
        }
      } catch (err) {
        console.error('Error en emergency stop:', err);
      }
    }
  };

  const handleResumeAll = async () => {
    try {
      const res = await fetch('/api/agent/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESUME_ALL' })
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error resuming agents:', err);
    }
  };

  const handleProjectModeChange = async (projectId: string, newMode: string) => {
    try {
      const res = await fetch('/api/agent/control', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, mode: newMode })
      });
      
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error changing project mode:', err);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getDecisionIcon = (contextType: string, outcome: string | null, riskLevel: number | null) => {
    if (outcome === 'rejected') return '❌';
    if (outcome === 'accepted') return '✅';
    if (riskLevel && riskLevel > 0.7) return '⚠️';
    if (contextType.includes('risk')) return '🔍';
    if (contextType.includes('price') || contextType.includes('pricing')) return '💰';
    if (contextType.includes('payment')) return '💵';
    if (contextType.includes('emergency')) return '🛑';
    if (contextType.includes('resume')) return '▶️';
    return '🤖';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-400" />;
      default: return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const allAgentsPaused = data?.projects.every(p => p.agentMode === 'paused');

  if (loading) {
    return (
      <Card className="bg-slate-900/80 border-cyan-500/30">
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-10 w-10 animate-spin mx-auto text-cyan-400" />
          <p className="mt-4 text-slate-400">Conectando con agentes de IA...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.projects.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-cyan-900/20 border-cyan-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="h-6 w-6 text-cyan-400" />
            Agent Command Center
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Radio className="h-12 w-12 mx-auto text-slate-500 mb-4" />
          <p className="text-slate-400 mb-2">Sin proyectos externos conectados</p>
          <p className="text-sm text-slate-500">
            Cuando conectes Projects Hub, aquí aparecerán balance, decisiones y estado de agentes.
            {error ? ` Estado del servicio: ${error}.` : ''}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            <Button onClick={() => window.location.href = '/projects-hub'} size="sm" className="bg-cyan-600 hover:bg-cyan-700">
              Abrir Projects Hub
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-cyan-900/20 border-cyan-500/30 backdrop-blur-sm">
      <CardHeader className="border-b border-cyan-500/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Agent Command Center
              </CardTitle>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                {isPolling ? (
                  <>
                    <CircleDot className="h-3 w-3 text-green-400 animate-pulse" />
                    <span className="text-green-400">EN VIVO</span>
                  </>
                ) : (
                  <>
                    <CircleDot className="h-3 w-3 text-slate-500" />
                    <span>Pausado</span>
                  </>
                )}
                {lastFetch && (
                  <span className="text-slate-500">
                    • Actualizado: {formatTime(lastFetch.toISOString())}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Controles globales */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <span className="text-sm text-slate-400">Auto-refresh</span>
              <Switch
                checked={isPolling}
                onCheckedChange={setIsPolling}
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>
            
            {allAgentsPaused ? (
              <Button
                onClick={handleResumeAll}
                className="bg-green-600 hover:bg-green-700 text-white"
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
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-6">
        {/* Alertas activas */}
        {data.alerts.length > 0 && (
          <div className="space-y-2">
            {data.alerts.map((alert, i) => (
              <div 
                key={i}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${
                  alert.severity === 'critical' 
                    ? 'bg-red-500/10 border-red-500/50 text-red-300'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300'
                    : 'bg-blue-500/10 border-blue-500/50 text-blue-300'
                }`}
              >
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Métricas Globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-slate-400">Balance Total</span>
            </div>
            <p className="text-lg font-bold text-green-400">
              {formatCurrency(data.global.totalBalance)}
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-slate-400">Este Mes</span>
            </div>
            <p className="text-lg font-bold text-yellow-400">
              {formatCurrency(data.global.monthlyRevenue)}
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Decisiones Hoy</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-cyan-400">
                {data.global.decisionsToday}
              </p>
              {getTrendIcon(data.global.revenueTrend)}
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-slate-400">Agentes Activos</span>
            </div>
            <p className="text-lg font-bold text-purple-400">
              {data.global.totalActiveAgents}
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-slate-400">Salud Sistema</span>
            </div>
            <p className={`text-lg font-bold ${
              data.global.systemHealth > 70 ? 'text-green-400' :
              data.global.systemHealth > 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {data.global.systemHealth}%
            </p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Total Acumulado</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(data.global.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Proyectos con control individual */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.projects.map(project => (
            <div 
              key={project.id}
              className={`bg-slate-800/30 rounded-lg p-4 border ${
                project.agentMode === 'paused' 
                  ? 'border-red-500/30 opacity-75' 
                  : 'border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-200">{project.name}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  project.agentMode === 'auto' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : project.agentMode === 'manual'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {project.agentMode.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-slate-500">Balance:</span>
                  <p className="text-green-400 font-mono">{formatCurrency(project.balance)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Trans/hora:</span>
                  <p className="text-cyan-400 font-mono">{project.transactionsPerHour.toFixed(1)}</p>
                </div>
              </div>
              
              {/* Control de modo */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={project.agentMode === 'auto' ? 'default' : 'outline'}
                  onClick={() => handleProjectModeChange(project.id, 'auto')}
                  className="flex-1 text-xs"
                >
                  Auto
                </Button>
                <Button
                  size="sm"
                  variant={project.agentMode === 'manual' ? 'default' : 'outline'}
                  onClick={() => handleProjectModeChange(project.id, 'manual')}
                  className="flex-1 text-xs"
                >
                  Manual
                </Button>
                <Button
                  size="sm"
                  variant={project.agentMode === 'paused' ? 'destructive' : 'outline'}
                  onClick={() => handleProjectModeChange(project.id, 'paused')}
                  className="flex-1 text-xs"
                >
                  Pausa
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Stream de Decisiones */}
        <div className="bg-black/50 rounded-lg border border-cyan-500/20 overflow-hidden">
          <div className="bg-slate-800/50 px-4 py-2 border-b border-cyan-500/20 flex items-center justify-between">
            <span className="text-sm font-mono text-cyan-400 flex items-center gap-2">
              <Radio className="h-4 w-4 animate-pulse" />
              STREAM DE DECISIONES
            </span>
            <span className="text-xs text-slate-500">
              {data.recentDecisions.length} decisiones recientes
            </span>
          </div>
          
          <div className="h-64 overflow-y-auto font-mono text-sm custom-scrollbar">
            {data.recentDecisions.length > 0 ? (
              <div className="p-2 space-y-1">
                {data.recentDecisions.slice(0, 50).map((decision) => (
                  <div 
                    key={decision.id}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded text-xs ${
                      decision.riskLevel && decision.riskLevel > 0.7 
                        ? 'bg-red-500/10 border-l-2 border-red-500' 
                        : decision.revenue > 0 
                        ? 'bg-green-500/5 border-l-2 border-green-500/50'
                        : 'bg-slate-800/20'
                    }`}
                  >
                    <span className="text-slate-500 w-16 flex-shrink-0">
                      [{formatTime(decision.timestamp)}]
                    </span>
                    <span className="text-cyan-400 w-20 flex-shrink-0 truncate">
                      {decision.projectName}:
                    </span>
                    <span className="flex-1 text-slate-300">
                      {getDecisionIcon(decision.contextType, decision.outcome, decision.riskLevel)}{' '}
                      {decision.actionLabel}
                      {decision.revenue > 0 && (
                        <span className="text-green-400 ml-2">
                          +{formatCurrency(decision.revenue)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Esperando decisiones de agentes...</p>
                  <p className="text-xs mt-1">Los datos aparecerán cuando los proyectos envíen información</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
