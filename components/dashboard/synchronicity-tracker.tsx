
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Sparkles, 
  Plus, 
  TrendingUp,
  Zap,
  Eye,
  Calendar,
  Hash
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Synchronicity {
  id: string;
  title: string;
  description: string;
  impact: number;
  timestamp: string;
  category: string;
  date: Date;
}

interface SynchronicityData {
  synchronicities: Synchronicity[];
  metrics: {
    synchronicityCount: number;
    synchronicityScore: number;
    manifestationRate: number;
  };
}

interface NewSynchronicity {
  title: string;
  description: string;
  impact: number;
  category: string;
}

export function SynchronicityTracker() {
  const [data, setData] = useState<SynchronicityData>({
    synchronicities: [],
    metrics: {
      synchronicityCount: 0,
      synchronicityScore: 0,
      manifestationRate: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSync, setNewSync] = useState<NewSynchronicity>({
    title: '',
    description: '',
    impact: 5,
    category: 'general'
  });

  useEffect(() => {
    fetchSynchronicities();
  }, []);

  const fetchSynchronicities = async () => {
    try {
      const response = await fetch('/api/synchronicities');
      if (response.ok) {
        const responseData = await response.json();
        const processedSynchronicities = responseData.synchronicities.map((sync: any) => ({
          ...sync,
          date: new Date(sync.date)
        }));
        
        setData({
          synchronicities: processedSynchronicities,
          metrics: responseData.metrics
        });
      }
    } catch (error) {
      console.error('Error obteniendo sincronicidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSynchronicity = async () => {
    if (!newSync.title || !newSync.description) return;

    try {
      setLoading(true);
      const response = await fetch('/api/synchronicities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSync)
      });

      if (response.ok) {
        setNewSync({
          title: '',
          description: '',
          impact: 5,
          category: 'general'
        });
        setShowAddForm(false);
        await fetchSynchronicities();
      }
    } catch (error) {
      console.error('Error agregando sincronicidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'numeric':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'relacional':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'temporal':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'manifestacion':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'guidance':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 8) return 'text-green-400';
    if (impact >= 6) return 'text-yellow-400';
    if (impact >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAlignmentLevel = (score: number) => {
    if (score >= 80) return { text: 'Flujo Alto', color: 'text-green-400' };
    if (score >= 60) return { text: 'Buen Flujo', color: 'text-yellow-400' };
    if (score >= 40) return { text: 'Flujo Medio', color: 'text-orange-400' };
    return { text: 'Baja Sincronía', color: 'text-red-400' };
  };

  // Preparar datos reales para gráficos: últimos 7 días, sin valores simulados
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - i));
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    const count = data.synchronicities.filter(sync => sync.date >= date && sync.date < nextDate).length;
    return {
      date: date.toLocaleDateString('es-ES', { weekday: 'short' }),
      synchronicities: count
    };
  });

  const hasSynchronicities = data.synchronicities.length > 0;
  const alignmentLevel = hasSynchronicities
    ? getAlignmentLevel(data.metrics.synchronicityScore)
    : { text: 'Sin datos suficientes', color: 'text-slate-400' };

  if (loading && data.synchronicities.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-emerald-900/30 border-emerald-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-emerald-400" />
            Sincronicidades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse text-slate-400">Detectando sincronías...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-emerald-900/30 border-emerald-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-emerald-400" />
            Sincronicidades
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/20"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="text-2xl font-bold text-emerald-400">
              {data.metrics.synchronicityCount}
            </div>
            <div className="text-xs text-slate-400">Sincronicidades</div>
          </div>
          
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className={`text-2xl font-bold ${alignmentLevel.color}`}>
              {Math.round(data.metrics.synchronicityScore)}%
            </div>
            <div className="text-xs text-slate-400">Nivel de Flujo</div>
          </div>
          
          <div className="p-3 bg-slate-800/30 rounded-lg">
            <div className="text-2xl font-bold text-teal-400">
              {Math.round(data.metrics.manifestationRate)}%
            </div>
            <div className="text-xs text-slate-400">Manifestación</div>
          </div>
        </div>

        {/* Estado de Alineación */}
        <div className="text-center p-3 bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <Eye className="h-5 w-5 text-emerald-400" />
            <span className={`font-semibold ${alignmentLevel.color}`}>
              {alignmentLevel.text}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {hasSynchronicities
              ? 'Basado en tus sincronicidades registradas'
              : 'Registra al menos una sincronicidad para calcular este indicador'}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Formulario para Agregar */}
        {showAddForm && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-emerald-500/20 space-y-4">
            <h3 className="text-lg font-semibold text-emerald-300">
              Registrar Nueva Sincronicidad
            </h3>
            
            <div className="space-y-3">
              <Input
                placeholder="Título de la sincronicidad"
                value={newSync.title}
                onChange={(e) => setNewSync(prev => ({ ...prev, title: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-slate-200"
              />
              
              <Textarea
                placeholder="Describe lo que ocurrió..."
                value={newSync.description}
                onChange={(e) => setNewSync(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-slate-200"
                rows={3}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Impacto (1-10)</label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={newSync.impact}
                    onChange={(e) => setNewSync(prev => ({ ...prev, impact: Number(e.target.value) }))}
                    className="bg-slate-700/50 border-slate-600 text-slate-200"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Categoría</label>
                  <select
                    value={newSync.category}
                    onChange={(e) => setNewSync(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2 rounded-md bg-slate-700/50 border border-slate-600 text-slate-200"
                  >
                    <option value="general">General</option>
                    <option value="numeric">Numérica</option>
                    <option value="relacional">Relacional</option>
                    <option value="temporal">Temporal</option>
                    <option value="manifestacion">Manifestación</option>
                    <option value="guidance">Guía</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button 
                onClick={addSynchronicity}
                disabled={loading || !newSync.title || !newSync.description}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {loading ? 'Guardando...' : 'Registrar'}
              </Button>
            </div>
          </div>
        )}

        {/* Gráfico de Tendencia */}
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4 text-center">
            Flujo de Sincronicidades
          </h3>
          {!hasSynchronicities && (
            <p className="-mt-2 mb-3 text-center text-xs text-slate-500">Sin valores simulados: la gráfica se llenará con tus registros reales.</p>
          )}
          
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="syncGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="synchronicities"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#syncGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista de Sincronicidades Recientes */}
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4">
            Sincronicidades Recientes
          </h3>
          
          {data.synchronicities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.synchronicities.slice(0, 6).map((sync, index) => (
                <div
                  key={sync.id}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-grow min-w-0">
                      <h4 className="font-semibold text-slate-200 truncate mb-1">
                        {sync.title}
                      </h4>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {sync.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getCategoryColor(sync.category)}`}
                      >
                        {sync.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-400" />
                      <span className={`font-medium ${getImpactColor(sync.impact)}`}>
                        Impacto: {sync.impact}/10
                      </span>
                    </div>
                    
                    <div className="text-slate-400 text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {sync.date.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay sincronicidades registradas</p>
              <p className="text-sm mt-1">
                Comienza a observar los patrones y sincronías en tu experiencia
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
