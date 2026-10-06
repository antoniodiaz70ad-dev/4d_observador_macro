'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Users,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Snapshot {
  id: string;
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  energy: number;
  coherence: number;
  connections: number;
  statusLabel: string | null;
  recommendation: string | null;
  triggerType: string;
  triggerReason: string | null;
  createdAt: string;
}

interface Trend {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  trend: 'improving' | 'stable' | 'declining' | 'slight_improvement';
  energyChange: number;
  coherenceChange: number;
  snapshotCount: number;
  firstSnapshot?: string;
  lastSnapshot?: string;
}

interface EvolutionData {
  snapshots: Snapshot[];
  trends: Trend[];
  summary: {
    total: number;
    improving: number;
    stable: number;
    declining: number;
  };
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  project: <Target className="w-4 h-4" />,
  relationship: <Users className="w-4 h-4" />,
  intention: <Lightbulb className="w-4 h-4" />,
  manifestation: <Sparkles className="w-4 h-4" />,
};

const TYPE_COLORS: Record<string, string> = {
  project: '#ff00ff',
  relationship: '#ffaa00',
  intention: '#00ff88',
  manifestation: '#ff0088',
};

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Mejorando' },
  slight_improvement: { icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Leve mejora' },
  stable: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Estable' },
  declining: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Declinando' },
};

export function NodeEvolution() {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/timeline/snapshots?days=${days}&limit=100`);
      if (!response.ok) throw new Error('Error al cargar datos');
      const result = await response.json();
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  const filteredTrends = data?.trends.filter(
    t => selectedType === 'all' || t.nodeType === selectedType
  ) || [];

  const getNodeSnapshots = (nodeId: string) => {
    return data?.snapshots
      .filter(s => s.nodeId === nodeId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      || [];
  };

  const formatPointChange = (value: number) => `${value >= 0 ? '+' : ''}${value} pts`;

  const formatDate = (value?: string) => value
    ? format(new Date(value), 'dd MMM', { locale: es })
    : 'sin fecha';

  if (loading) {
    return (
      <Card className="bg-slate-900/80 border-slate-700 p-6">
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Cargando evolución...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-900/80 border-slate-700 p-6">
        <div className="text-center text-slate-400">
          <p className="mb-3">{error}</p>
          <Button onClick={fetchData} variant="outline" size="sm">
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  if (!data || data.snapshots.length === 0) {
    return (
      <Card className="bg-slate-900/80 border-slate-700 p-6">
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-300 mb-2">Sin datos de evolución</h3>
          <p className="text-sm text-slate-500 mb-4">
            Esta sección muestra snapshots del mapa cuando cambian nodos o cuando guardas una captura desde Tablero 3D.
          </p>
          <p className="text-xs text-slate-600">
            Memory 4D guarda capturas comparativas; este panel resume evolución operativa de nodos.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/80 border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Cambios entre capturas — Evolución de nodos</h3>
            <p className="text-xs text-slate-400">Snapshots del mapa: energía, coherencia fuente, conexiones y fechas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-1.5"
          >
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </select>
          <Button onClick={fetchData} variant="ghost" size="sm" className="text-slate-400">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-white">{data.summary.total}</p>
          <p className="text-xs text-slate-400">Capturas</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/20">
          <p className="text-2xl font-bold text-green-400">{data.summary.improving}</p>
          <p className="text-xs text-green-400/70">Mejorando</p>
        </div>
        <div className="bg-slate-500/10 rounded-lg p-3 text-center border border-slate-500/20">
          <p className="text-2xl font-bold text-slate-400">{data.summary.stable}</p>
          <p className="text-xs text-slate-400/70">Estables</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/20">
          <p className="text-2xl font-bold text-red-400">{data.summary.declining}</p>
          <p className="text-xs text-red-400/70">Declinando</p>
        </div>
      </div>

      {/* Filtros por tipo */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          variant={selectedType === 'all' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedType('all')}
          className={selectedType === 'all' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'}
        >
          Todos
        </Button>
        {['project', 'relationship', 'intention', 'manifestation'].map(type => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedType(type)}
            className={selectedType === type ? 'bg-slate-700' : 'text-slate-400'}
          >
            <span style={{ color: TYPE_COLORS[type] }}>{TYPE_ICONS[type]}</span>
            <span className="ml-1 capitalize">{type === 'project' ? 'Proyectos' : 
              type === 'relationship' ? 'Relaciones' : 
              type === 'intention' ? 'Intenciones' : 'Manifestaciones'}</span>
          </Button>
        ))}
      </div>

      {/* Lista de tendencias */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTrends.length === 0 ? (
          <p className="text-center text-slate-500 py-4">
            No hay nodos con capturas en este período
          </p>
        ) : (
          filteredTrends.map(trend => {
            const config = TREND_CONFIG[trend.trend];
            const TrendIcon = config.icon;
            const isExpanded = expandedNode === trend.nodeId;
            const allSnapshots = getNodeSnapshots(trend.nodeId);
            const snapshots = isExpanded ? allSnapshots : [];
            const firstSnapshot = allSnapshots[0];
            const lastSnapshot = allSnapshots[allSnapshots.length - 1];
            const energyBefore = firstSnapshot ? Math.round(firstSnapshot.energy * 100) : null;
            const energyAfter = lastSnapshot ? Math.round(lastSnapshot.energy * 100) : null;
            const coherenceBefore = firstSnapshot ? Math.round(firstSnapshot.coherence * 100) : null;
            const coherenceAfter = lastSnapshot ? Math.round(lastSnapshot.coherence * 100) : null;

            return (
              <div key={trend.nodeId} className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                {/* Trend Header */}
                <button
                  onClick={() => setExpandedNode(isExpanded ? null : trend.nodeId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${TYPE_COLORS[trend.nodeType]}20` }}
                    >
                      <span style={{ color: TYPE_COLORS[trend.nodeType] }}>
                        {TYPE_ICONS[trend.nodeType]}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium">{trend.nodeLabel}</p>
                      <p className="text-xs text-slate-500">{trend.snapshotCount} capturas · {formatDate(firstSnapshot?.createdAt)} → {formatDate(lastSnapshot?.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Cambios */}
                    <div className="hidden text-right text-xs text-slate-400 md:block">
                      <div className="flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>Energía: {energyBefore ?? '—'} → {energyAfter ?? '—'} ({formatPointChange(trend.energyChange)})</span>
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <span>Coherencia: {coherenceBefore ?? '—'} → {coherenceAfter ?? '—'} ({formatPointChange(trend.coherenceChange)})</span>
                      </div>
                    </div>
                    
                    {/* Trend Badge */}
                    <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${config.bg} ${config.color}`}>
                      <TrendIcon className="w-3 h-3" />
                      {config.label}
                    </div>
                    
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && snapshots.length > 0 && (
                  <div className="px-4 pb-4 border-t border-slate-700/50">
                    <div className="pt-3 space-y-2">
                      <p className="text-xs text-slate-500 mb-2">Historial de cambios:</p>
                      {snapshots.slice(-5).map((snap, idx) => (
                        <div 
                          key={snap.id}
                          className="flex items-center justify-between text-sm bg-slate-900/50 rounded-lg p-2"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-400">
                              {format(new Date(snap.createdAt), 'dd MMM, HH:mm', { locale: es })}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-xs">
                              <span className="text-slate-500">Energía: </span>
                              <span className="text-yellow-400">{(snap.energy * 100).toFixed(0)}%</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-slate-500">Coherencia: </span>
                              <span className="text-cyan-400">{(snap.coherence * 100).toFixed(0)}%</span>
                            </div>
                            {snap.statusLabel && (
                              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                {snap.statusLabel}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {snapshots.length > 5 && (
                        <p className="text-xs text-slate-500 text-center">
                          +{snapshots.length - 5} capturas anteriores
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default NodeEvolution;

