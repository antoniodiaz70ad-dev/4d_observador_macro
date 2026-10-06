'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Sparkles, 
  Sliders, 
  Brain,
  Loader2,
  AlertCircle,
  Info,
  LogIn,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import WolcoffScene from '@/components/wolcoff/WolcoffScene';
import { DataSourceNote } from '@/components/ui/indicator-clarity';

export default function WolcoffPage() {
  const [coherence, setCoherence] = useState(0.7);
  const [energy, setEnergy] = useState(0.8);
  const [diagnosis, setDiagnosis] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);

  const handleAIAnalysis = useCallback(async () => {
    if (!inputText.trim() || inputText.length < 10) {
      setError('El texto debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);
    setError(null);
    setRequiresAuth(false);

    try {
      const res = await fetch('/api/gemini/analyze-coherence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: inputText,
          context: 'Análisis de proyecto personal'
        })
      });

      const data = await res.json();

      // Manejar error de autenticación
      if (res.status === 401 || data.requiresAuth) {
        setRequiresAuth(true);
        setError(null);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Error al analizar');
      }
      
      if (data.success && data.analysis) {
        setCoherence(data.analysis.coherence);
        setEnergy(data.analysis.energy);
        setDiagnosis(data.analysis.diagnosis);
        setRecommendation(data.analysis.recommendation);
        setRequiresAuth(false);
      }
    } catch (err) {
      setError('Error al analizar. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [inputText]);

  // Determinar estado basado en coherencia
  const getStateLabel = (coh: number) => {
    if (coh >= 0.8) return { label: 'Flujo', color: '#FFD700', emoji: '✨' };
    if (coh >= 0.6) return { label: 'Expansión', color: '#00FF88', emoji: '🚀' };
    if (coh >= 0.4) return { label: 'Fricción', color: '#FF8C00', emoji: '⚠️' };
    if (coh >= 0.2) return { label: 'Saturación', color: '#FF4500', emoji: '🔥' };
    return { label: 'Colapso', color: '#808080', emoji: '💀' };
  };

  const state = getStateLabel(coherence);

  return (
    <div className="min-h-screen bg-black">
      <div className="grid grid-cols-1 lg:grid-cols-3 h-screen">
        {/* Visualizador 3D - 2/3 de pantalla */}
        <div className="lg:col-span-2 relative bg-gradient-to-b from-slate-950 to-black">
          <WolcoffScene coherence={coherence} energy={energy} />
          
          {/* Header overlay */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            
            <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-right">
              <p className="text-cyan-400 font-mono text-xs tracking-wider">WOLCOFF ENGINE v1.0</p>
              <p className="text-white text-sm mt-1">
                Coherencia {mode === 'manual' ? 'manual' : 'IA'}: <span style={{ color: state.color }} className="font-bold">{(coherence * 100).toFixed(0)}%</span>
              </p>
              <p className="text-white text-sm">
                Energía {mode === 'manual' ? 'manual' : 'IA'}: <span className="text-yellow-400 font-bold">{(energy * 100).toFixed(0)}%</span>
              </p>
            </div>
          </div>

          {/* Estado actual overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="bg-black/80 backdrop-blur-sm border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{state.emoji}</span>
                  <div>
                    <p className="text-sm text-slate-400">Estado geométrico · {mode === 'manual' ? 'manual' : 'IA'}</p>
                    <p className="text-xl font-bold" style={{ color: state.color }}>
                      {state.label}
                    </p>
                  </div>
                </div>
                
                {diagnosis && (
                  <div className="text-right max-w-md">
                    <p className="text-sm text-slate-400">Diagnóstico IA</p>
                    <p className="text-white text-sm">{diagnosis}</p>
                  </div>
                )}
              </div>
              
              {recommendation && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <p className="text-sm text-cyan-400">
                    <span className="font-semibold">Recomendación:</span> {recommendation}
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Panel de Control - 1/3 de pantalla */}
        <div className="bg-slate-950 p-6 overflow-auto border-l border-slate-800">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">
              Geometría Ontológica
            </h1>
            <p className="text-slate-400 text-sm">
              Visualiza tu estado energético en tiempo real
            </p>
          </div>

          <DataSourceNote
            title={mode === 'manual' ? 'Escenario manual' : 'Análisis desde texto'}
            tone={mode === 'manual' ? 'cyan' : 'purple'}
            className="mb-5"
          >
            {mode === 'manual'
              ? 'Los porcentajes de Wolcoff son una simulación controlada por sliders. Sirven para explorar escenarios y no sustituyen la coherencia calculada con registros.'
              : 'La IA estima coherencia y energía desde el texto que escribes aquí. Identifica el origen como análisis de texto, no como lectura completa de todo el sistema.'}
          </DataSourceNote>

          {/* Tabs: Manual / IA */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                mode === 'manual' 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Manual
            </button>
            <button
              onClick={() => setMode('ai')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                mode === 'ai' 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Brain className="w-4 h-4" />
              Análisis IA
            </button>
          </div>

          {mode === 'manual' ? (
            /* Controles Manuales */
            <div className="space-y-6">
              {/* Coherencia */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-slate-300 font-medium">Coherencia</label>
                  <span className="text-lg font-bold" style={{ color: state.color }}>
                    {(coherence * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={coherence * 100}
                  onChange={(e) => setCoherence(Number(e.target.value) / 100)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Nivel de alineación y flujo vs resistencia
                </p>
              </div>

              {/* Energía */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-slate-300 font-medium">Energía</label>
                  <span className="text-lg font-bold text-yellow-400">
                    {(energy * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={energy * 100}
                  onChange={(e) => setEnergy(Number(e.target.value) / 100)}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Nivel de vitalidad y recursos disponibles
                </p>
              </div>

              {/* Presets */}
              <div className="pt-4 border-t border-slate-800">
                <p className="text-sm text-slate-400 mb-3">Estados predefinidos</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setCoherence(0.95); setEnergy(0.9); }}
                    className="px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-500/30 transition-colors"
                  >
                    ✨ Flujo
                  </button>
                  <button
                    onClick={() => { setCoherence(0.7); setEnergy(0.75); }}
                    className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                  >
                    🚀 Expansión
                  </button>
                  <button
                    onClick={() => { setCoherence(0.4); setEnergy(0.5); }}
                    className="px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
                  >
                    ⚠️ Fricción
                  </button>
                  <button
                    onClick={() => { setCoherence(0.15); setEnergy(0.2); }}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                  >
                    💀 Colapso
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Análisis con IA */
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 font-medium mb-2 block">
                  Describe tu situación actual
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ej: Siento que estoy empujando mucho pero no avanzo. El proyecto está estancado y me siento frustrado..."
                  className="w-full h-32 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500 transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Mínimo 10 caracteres. Sé honesto y descriptivo.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Mensaje de autenticación requerida */}
              {requiresAuth && (
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Análisis IA Protegido</p>
                      <p className="text-sm text-slate-400">Inicia sesión para usar esta función</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    El análisis con inteligencia artificial está disponible para usuarios registrados. 
                    Crea una cuenta gratuita para desbloquear todas las funciones.
                  </p>
                  <div className="flex gap-2">
                    <Link href="/auth/signin" className="flex-1">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        <LogIn className="w-4 h-4 mr-2" />
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="flex-1">
                      <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                        Crear Cuenta
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {!requiresAuth && (
                <Button
                  onClick={handleAIAnalysis}
                  disabled={loading || inputText.length < 10}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analizar con IA
                    </>
                  )}
                </Button>
              )}

              {/* Info */}
              <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 mt-0.5" />
                  <div className="text-xs text-slate-400">
                    <p className="font-medium text-cyan-400 mb-1">¿Cómo funciona?</p>
                    <p>
                      La IA analiza tu texto para detectar niveles de resistencia, 
                      flujo y energía. La geometría se actualiza en tiempo real 
                      reflejando tu estado actual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leyenda */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-sm text-slate-400 mb-3">Leyenda de Estados</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
                <span className="text-slate-300">Flujo (80-100%)</span>
                <span className="text-slate-500 ml-auto">Esfera perfecta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00FF88]" />
                <span className="text-slate-300">Expansión (60-80%)</span>
                <span className="text-slate-500 ml-auto">Leve ondulación</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF8C00]" />
                <span className="text-slate-300">Fricción (40-60%)</span>
                <span className="text-slate-500 ml-auto">Distorsión visible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#FF4500]" />
                <span className="text-slate-300">Saturación (20-40%)</span>
                <span className="text-slate-500 ml-auto">Alta distorsión</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#808080]" />
                <span className="text-slate-300">Colapso (0-20%)</span>
                <span className="text-slate-500 ml-auto">Forma errática</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

