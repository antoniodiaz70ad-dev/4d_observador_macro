
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Brain, Heart, Zap, Activity, Settings } from 'lucide-react';
import { DataSourceNote, IndicatorClarity } from '@/components/ui/indicator-clarity';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';

interface CoherenceData {
  overallCoherence: number;
  emotionalCoherence: number;
  logicalCoherence: number;
  energeticCoherence: number;
  source?: string;
  message?: string;
}

export function CoherenceMeters() {
  const [coherence, setCoherence] = useState<CoherenceData>({
    overallCoherence: 0,
    emotionalCoherence: 0,
    logicalCoherence: 0,
    energeticCoherence: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempValues, setTempValues] = useState<CoherenceData>(coherence);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoherence();
  }, []);

  const fetchCoherence = async () => {
    try {
      const response = await fetch('/api/coherence');
      if (response.ok) {
        const data = await response.json();
        setCoherence(data);
        setTempValues(data);
      }
    } catch (error) {
      console.error('Error obteniendo coherencia:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCoherence = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coherence', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tempValues)
      });

      if (response.ok) {
        const data = await response.json();
        setCoherence(data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error actualizando coherencia:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoherenceColor = (value: number) => {
    if (value >= 80) return 'rgb(34, 197, 94)';
    if (value >= 60) return 'rgb(234, 179, 8)';
    if (value >= 40) return 'rgb(249, 115, 22)';
    return 'rgb(239, 68, 68)';
  };

  const getCoherenceStatus = (value: number) => {
    if (value >= 80) return 'Excelente';
    if (value >= 60) return 'Buena';
    if (value >= 40) return 'Regular';
    return 'Necesita atención';
  };

  const hasRealMetrics = !['empty', 'insufficient_signals'].includes(coherence.source || '') && (
    coherence.overallCoherence > 0 ||
    coherence.emotionalCoherence > 0 ||
    coherence.logicalCoherence > 0 ||
    coherence.energeticCoherence > 0
  );

  const radialData = [
    {
      name: 'Emocional',
      value: coherence.emotionalCoherence,
      fill: '#8b5cf6'
    },
    {
      name: 'Lógica',
      value: coherence.logicalCoherence,
      fill: '#06b6d4'
    },
    {
      name: 'Energética',
      value: coherence.energeticCoherence,
      fill: '#eab308'
    }
  ];

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <Activity className="h-8 w-8 text-purple-400" />
            Coherencia 4D
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse text-slate-400">Cargando métricas...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-purple-900/30 border-purple-500/30 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
          <Activity className="h-8 w-8 text-purple-400" />
          Coherencia 4D
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <IndicatorClarity />

        <DataSourceNote title={isEditing ? 'Fuente: borrador manual' : hasRealMetrics ? 'Fuente: cálculo con registros suficientes' : 'Fuente: sin datos suficientes'} tone={hasRealMetrics ? 'purple' : 'cyan'}>
          {isEditing
            ? 'Los valores que ajustes aquí son una captura manual hasta guardar. No equivalen a un diagnóstico calculado.'
            : hasRealMetrics
              ? 'La coherencia se presenta como cálculo derivado de señales disponibles. Úsala como lectura de contexto, no como medición absoluta.'
              : 'Faltan proyecto, relación o registro diario. Por eso se ocultan porcentajes, gráficos y clasificación.'}
        </DataSourceNote>

        {!hasRealMetrics && !isEditing && (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 text-center">
            <p className="text-sm font-semibold text-purple-200">Aún no hay coherencia calculada con tus registros</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Estos indicadores se vuelven útiles cuando hay proyecto, relación y registro diario. Por ahora no se muestran porcentajes de respaldo ni métricas históricas sin contexto suficiente.
            </p>
            <Button
              onClick={() => setIsEditing(true)}
              className="mt-4 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
            >
              Registrar estado inicial
            </Button>
          </div>
        )}

        {(hasRealMetrics || isEditing) && (
          <>
        {/* Coherencia General */}
        {isEditing && !hasRealMetrics ? (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 text-center">
            <p className="text-sm font-semibold text-cyan-100">Borrador manual</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Ajusta los tres componentes antes de guardar. Mientras sea borrador no se emite porcentaje general ni clasificación como “Necesita atención”.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-6xl font-bold mb-2" style={{ color: getCoherenceColor(coherence.overallCoherence) }}>
              {Math.round(coherence.overallCoherence)}%
            </div>
            <div className="text-lg text-slate-300 mb-1">Coherencia General</div>
            <div className="text-sm" style={{ color: getCoherenceColor(coherence.overallCoherence) }}>
              {getCoherenceStatus(coherence.overallCoherence)}
            </div>
          </div>
        )}

        {/* Gráfico Radial */}
        {(!isEditing || hasRealMetrics) && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="80%" data={radialData}>
              <RadialBar
                dataKey="value"
                cornerRadius={8}
                fill="#8884d8"
              />
              <Legend 
                wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }}
                verticalAlign="top"
                height={50}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        )}

        {/* Métricas Detalladas */}
        <div className="grid gap-4">
          {/* Coherencia Emocional */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-purple-400" />
                <span className="text-slate-300">Coherencia Emocional</span>
              </div>
              <span className="text-lg font-bold text-purple-400">
                {Math.round(isEditing ? tempValues.emotionalCoherence : coherence.emotionalCoherence)}%
              </span>
            </div>
            {isEditing ? (
              <Slider
                value={[tempValues.emotionalCoherence]}
                onValueChange={(value) => setTempValues(prev => ({ ...prev, emotionalCoherence: value[0] }))}
                max={100}
                step={1}
                className="w-full"
              />
            ) : (
              <Progress 
                value={coherence.emotionalCoherence} 
                className="h-2 bg-slate-700"
              />
            )}
          </div>

          {/* Coherencia Lógica */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-400" />
                <span className="text-slate-300">Coherencia Lógica</span>
              </div>
              <span className="text-lg font-bold text-cyan-400">
                {Math.round(isEditing ? tempValues.logicalCoherence : coherence.logicalCoherence)}%
              </span>
            </div>
            {isEditing ? (
              <Slider
                value={[tempValues.logicalCoherence]}
                onValueChange={(value) => setTempValues(prev => ({ ...prev, logicalCoherence: value[0] }))}
                max={100}
                step={1}
                className="w-full"
              />
            ) : (
              <Progress 
                value={coherence.logicalCoherence} 
                className="h-2 bg-slate-700"
              />
            )}
          </div>

          {/* Coherencia Energética */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="text-slate-300">Coherencia Energética</span>
              </div>
              <span className="text-lg font-bold text-yellow-400">
                {Math.round(isEditing ? tempValues.energeticCoherence : coherence.energeticCoherence)}%
              </span>
            </div>
            {isEditing ? (
              <Slider
                value={[tempValues.energeticCoherence]}
                onValueChange={(value) => setTempValues(prev => ({ ...prev, energeticCoherence: value[0] }))}
                max={100}
                step={1}
                className="w-full"
              />
            ) : (
              <Progress 
                value={coherence.energeticCoherence} 
                className="h-2 bg-slate-700"
              />
            )}
          </div>
        </div>
          </>
        )}

        {/* Botones de Acción */}
        {isEditing && (
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setTempValues(coherence);
                setIsEditing(false);
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={updateCoherence}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
            >
              Actualizar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
