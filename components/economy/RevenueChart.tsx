'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, BarChart2, Activity, Calendar } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Componente de Gráficas Históricas de Ingresos
// Muestra tendencias de revenue y decisiones a lo largo del tiempo
// ═══════════════════════════════════════════════════════════════════════════

interface RevenueData {
  date: string;
  revenue: number;
  decisions: number;
  projects: { [key: string]: number };
}

interface RevenueChartProps {
  className?: string;
}

export function RevenueChart({ className }: RevenueChartProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/revenue-history?period=${period}`);
        if (response.ok) {
          const result = await response.json();
          setData(result.history || []);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  // Calcular métricas resumidas
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalDecisions = data.reduce((sum, d) => sum + d.decisions, 0);
  const avgDaily = data.length > 0 ? totalRevenue / data.length : 0;
  
  // Tendencia: comparar primera mitad vs segunda mitad
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint).reduce((sum, d) => sum + d.revenue, 0);
  const secondHalf = data.slice(midpoint).reduce((sum, d) => sum + d.revenue, 0);
  const trend = secondHalf > firstHalf ? 'up' : secondHalf < firstHalf ? 'down' : 'stable';
  const trendPercent = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-400 text-xs mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'revenue' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={`bg-slate-900/70 border-slate-700 ${className}`}>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-pulse text-cyan-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Cargando gráficas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={`bg-slate-900/70 border-slate-700 ${className}`}>
        <CardContent className="flex h-80 items-center justify-center">
          <div className="max-w-sm text-center">
            <BarChart2 className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="font-semibold text-slate-200">Sin historial real de ingresos</p>
            <p className="mt-2 text-sm text-slate-500">Conecta proyectos externos y registra decisiones para activar esta gráfica. No se muestran datos de ejemplo.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-900/70 border-slate-700 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Historial de Ingresos
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Selector de tipo de gráfica */}
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setChartType('area')}
                className={`px-2 py-1 rounded text-xs ${
                  chartType === 'area' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Área
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-2 py-1 rounded text-xs ${
                  chartType === 'bar' 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Barras
              </button>
            </div>

            {/* Selector de periodo */}
            <div className="flex bg-slate-800 rounded-lg p-0.5">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2 py-1 rounded text-xs ${
                    period === p 
                      ? 'bg-purple-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === '7d' ? '7 días' : p === '30d' ? '30 días' : '90 días'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Métricas resumidas */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Total Período</p>
            <p className="text-lg font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Promedio Diario</p>
            <p className="text-lg font-bold text-cyan-400">{formatCurrency(avgDaily)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Decisiones</p>
            <p className="text-lg font-bold text-purple-400">{totalDecisions}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Tendencia</p>
            <p className={`text-lg font-bold ${
              trend === 'up' ? 'text-green-400' : 
              trend === 'down' ? 'text-red-400' : 'text-slate-400'
            }`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} 
              {Math.abs(trendPercent).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Gráfica */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="decisionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.split('-').slice(1).join('/')}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#10B981" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#8B5CF6" 
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Ingresos"
                  stroke="#10B981"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="decisions"
                  name="Decisiones"
                  stroke="#8B5CF6"
                  fill="url(#decisionsGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6B7280" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => value.split('-').slice(1).join('/')}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#10B981" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#8B5CF6" 
                  tick={{ fontSize: 10 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="revenue" 
                  name="Ingresos"
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="decisions" 
                  name="Decisiones"
                  fill="#8B5CF6" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
