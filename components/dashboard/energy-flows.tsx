
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Settings,
  RefreshCw
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface EnergyFlow {
  category: string;
  value: number;
  label: string;
  rawCategory?: string;
  rawValue?: number;
}

interface EnergyData {
  flows: EnergyFlow[];
  source?: string;
  signalCounts?: { projects: number; relationships: number };
  calculation?: {
    formula: string;
    totalRawEnergy: number;
    inputs: {
      projects: string;
      relationships: string;
    };
    exchangeFactors: Record<string, number>;
  };
  detailed: {
    inputs: Array<{
      source: string;
      type: string;
      value: number;
      quality: string;
    }>;
    outputs: Array<{
      target: string;
      type: string;
      value: number;
      category?: string;
      quality?: string;
    }>;
  };
  summary: {
    totalActive: number;
    highestFlow: string;
    energyBalance: string;
  };
}

const ENERGY_COLORS = [
  '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#06b6d4'
];

export function EnergyFlows() {
  const [energyData, setEnergyData] = useState<EnergyData>({
    flows: [],
    detailed: { inputs: [], outputs: [] },
    summary: { totalActive: 0, highestFlow: '', energyBalance: 'equilibrado' }
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [tempFlows, setTempFlows] = useState<EnergyFlow[]>([]);

  useEffect(() => {
    fetchEnergyFlows();
  }, []);

  const fetchEnergyFlows = async () => {
    try {
      const response = await fetch('/api/energy-flows');
      if (response.ok) {
        const data = await response.json();
        setEnergyData(data);
        setTempFlows(data.flows);
      }
    } catch (error) {
      console.error('Error obteniendo flujos de energía:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEnergyFlows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/energy-flows', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ flows: tempFlows })
      });

      if (response.ok) {
        const data = await response.json();
        setEnergyData(prev => ({ ...prev, flows: data.flows }));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error actualizando flujos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBalanceLabel = (balance: string) => {
    const labels: Record<string, string> = {
      recibiendo: 'Recibiendo',
      dando: 'Dando',
      equilibrado: 'Equilibrado',
      'sin datos': 'Sin datos',
    };
    return labels[balance] || balance;
  };

  const getBalanceIcon = (balance: string) => {
    switch (balance) {
      case 'recibiendo':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'dando':
        return <TrendingDown className="h-4 w-4 text-blue-400" />;
      default:
        return <Minus className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getBalanceColor = (balance: string) => {
    switch (balance) {
      case 'recibiendo':
        return 'text-green-400';
      case 'dando':
        return 'text-blue-400';
      default:
        return 'text-yellow-400';
    }
  };

  // Preparar datos para gráficos
  const pieData = energyData.flows.map((flow, index) => ({
    name: flow.label,
    value: flow.value,
    fill: ENERGY_COLORS[index % ENERGY_COLORS.length]
  }));

  const hasEnergySignals = energyData.source !== 'insufficient_signals' && energyData.flows.length > 0;

  const barData = energyData.flows.slice(0, 6).map((flow, index) => ({
    category: flow.label.replace(/[^\w\s]/gi, ''),
    input: energyData.detailed.inputs
      .filter(input => input.type === flow.category)
      .reduce((sum, input) => sum + input.value, 0),
    output: energyData.detailed.outputs
      .filter(output => output.category === flow.category || output.type === flow.category)
      .reduce((sum, output) => sum + output.value, 0)
  }));

  if (loading && energyData.flows.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-yellow-900/30 border-yellow-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-400" />
            Flujos de Energía
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse text-slate-400">Analizando flujos energéticos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasEnergySignals) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-yellow-900/30 border-yellow-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-400" />
            Flujos de Energía
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <Zap className="h-12 w-12 mx-auto text-slate-500 mb-4" />
          <p className="font-semibold text-slate-200">Sin datos suficientes para calcular flujos</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Los porcentajes aparecerán cuando existan proyectos activos o relaciones registradas. No se muestran áreas ni balances de ejemplo.
          </p>
          <p className="mt-3 text-xs text-slate-600">
            Fuente actual: {energyData.signalCounts?.projects || 0} proyectos · {energyData.signalCounts?.relationships || 0} relaciones
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-yellow-900/30 border-yellow-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-400" />
            Flujos de Energía
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/20"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchEnergyFlows}
              className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/20"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Balance General */}
        <div className="flex items-center justify-center gap-2 p-3 bg-slate-800/50 rounded-lg">
          {getBalanceIcon(energyData.summary.energyBalance)}
          <span className={`font-semibold ${getBalanceColor(energyData.summary.energyBalance)}`}>
            Balance: {getBalanceLabel(energyData.summary.energyBalance)}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-sm font-semibold text-yellow-100">Fuente y cálculo</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            Fuente actual: {energyData.signalCounts?.projects || 0} proyectos activos · {energyData.signalCounts?.relationships || 0} relaciones. Fórmula: cada porcentaje sale del valor bruto de su categoría dividido entre la suma total ({energyData.calculation?.totalRawEnergy ?? 0}).
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {energyData.flows.map(flow => (
              <div key={flow.category} className="rounded-lg bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
                <span className="font-medium text-slate-100">{flow.label}</span>: {flow.rawValue ?? '—'} / {energyData.calculation?.totalRawEnergy ?? '—'} = {flow.value}%
              </div>
            ))}
          </div>
        </div>

        {isEditing && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-sm font-semibold text-cyan-100">Borrador manual</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Estás ajustando una distribución manual. Estos cambios no son un diagnóstico ni una clasificación hasta que presiones “Aplicar Cambios”.
            </p>
          </div>
        )}

        {/* Distribución Principal */}
        <div>
          <h3 className="text-lg font-semibold text-slate-200 mb-4 text-center">
            Distribución de Energía
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gráfico de Torta */}
            <div className="h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Energía']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 10 }}
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lista Detallada */}
            <div className="space-y-3 max-h-64 overflow-y-auto min-w-0 lg:col-span-2">
              {(isEditing ? tempFlows : energyData.flows).map((flow, index) => (
                <div key={flow.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: ENERGY_COLORS[index % ENERGY_COLORS.length] }}
                      />
                      <span className="text-sm text-slate-300">{flow.label}</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-400">
                      {isEditing ? Math.round(tempFlows[index]?.value || 0) : flow.value}%
                    </span>
                  </div>
                  
                  {isEditing ? (
                    <Slider
                      value={[tempFlows[index]?.value || 0]}
                      onValueChange={(value) => {
                        const newFlows = [...tempFlows];
                        newFlows[index] = { ...newFlows[index], value: value[0] };
                        setTempFlows(newFlows);
                      }}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  ) : (
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${flow.value}%`,
                          backgroundColor: ENERGY_COLORS[index % ENERGY_COLORS.length]
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Flujos de Entrada y Salida */}
        {barData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4 text-center">
              Entrada vs Salida de Energía
            </h3>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 20, left: 10, bottom: 45 }}>
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 10 }}
                    verticalAlign="top"
                    height={30}
                  />
                  <Bar dataKey="input" fill="#10b981" name="Entrada" />
                  <Bar dataKey="output" fill="#f59e0b" name="Salida" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Insights Energéticos */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-800/30 rounded-lg">
            <div className="text-2xl font-bold text-yellow-400">
              {energyData.summary.totalActive}
            </div>
            <div className="text-sm text-slate-400">Áreas Activas</div>
          </div>
          
          <div className="text-center p-4 bg-slate-800/30 rounded-lg">
            <div className="text-lg font-bold text-orange-400 truncate">
              {energyData.summary.highestFlow || 'N/A'}
            </div>
            <div className="text-sm text-slate-400">Mayor Flujo</div>
          </div>
          
          <div className="text-center p-4 bg-slate-800/30 rounded-lg">
            <div className={`text-lg font-bold ${getBalanceColor(energyData.summary.energyBalance)}`}>
              {getBalanceLabel(energyData.summary.energyBalance)}
            </div>
            <div className="text-sm text-slate-400">Estado</div>
          </div>
        </div>

        {/* Botones de Acción */}
        {isEditing && (
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setTempFlows(energyData.flows);
                setIsEditing(false);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={updateEnergyFlows}
              disabled={loading}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {loading ? 'Actualizando...' : 'Aplicar Cambios'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
