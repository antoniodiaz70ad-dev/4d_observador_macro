'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  User, 
  Target, 
  Users, 
  Eye, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip?: () => void;
  initialStep?: number;
}

const STEPS = [
  {
    id: 0,
    title: 'Bienvenido a OBSERVADOR4D',
    subtitle: 'Tu sistema de lectura de realidad',
    icon: Sparkles,
    description: 'Vamos a configurar tu espacio de observación personal. Solo tomará unos minutos.',
  },
  {
    id: 1,
    title: 'Crea tu Nodo Self',
    subtitle: 'Tú eres el centro',
    icon: User,
    description: 'Tu nombre aparecerá como el nodo central del tablero 3D. Todo gira alrededor de ti.',
  },
  {
    id: 2,
    title: 'Agrega un Proyecto',
    subtitle: 'Define tu primer enfoque',
    icon: Target,
    description: 'Un proyecto es algo en lo que inviertes energía. Puede ser laboral, personal o creativo.',
  },
  {
    id: 3,
    title: 'Conecta una Relación',
    subtitle: 'Nadie crea solo',
    icon: Users,
    description: 'Agrega una persona importante en tu vida. Verás cómo su energía impacta tu sistema.',
  },
  {
    id: 4,
    title: 'Observa tu Geometría',
    subtitle: 'La realidad es un código geométrico',
    icon: Eye,
    description: 'Ahora puedes ver el estado de tu sistema. La geometría refleja tu coherencia interna.',
  },
];

export function OnboardingWizard({ onComplete, onSkip, initialStep = 0 }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    projectName: '',
    projectDescription: '',
    relationshipName: '',
    relationshipType: 'professional',
  });

  const StepIcon = STEPS[currentStep].icon;

  const handleNext = async () => {
    setLoading(true);

    try {
      // Validaciones y guardado por paso
      switch (currentStep) {
        case 0:
          // Solo intro, pasar al siguiente
          break;

        case 1:
          // Guardar nombre del usuario (Self)
          if (!formData.userName.trim()) {
            toast.error('Por favor ingresa tu nombre');
            setLoading(false);
            return;
          }
          const selfRes = await fetch('/api/user/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName: formData.userName, step: 1 }),
          });
          if (!selfRes.ok) throw new Error('Error al guardar nombre');
          toast.success('¡Nodo Self creado!');
          break;

        case 2:
          // Crear proyecto
          if (!formData.projectName.trim()) {
            toast.error('Por favor nombra tu proyecto');
            setLoading(false);
            return;
          }
          const projectRes = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.projectName,
              description: formData.projectDescription || 'Proyecto creado en onboarding',
              category: 'personal',
              energyInvested: 5,
              impactLevel: 7,
            }),
          });
          if (!projectRes.ok) throw new Error('Error al crear proyecto');
          
          await fetch('/api/user/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 2 }),
          });
          toast.success('¡Proyecto agregado al tablero!');
          break;

        case 3:
          // Crear relación
          if (!formData.relationshipName.trim()) {
            toast.error('Por favor nombra la relación');
            setLoading(false);
            return;
          }
          const relRes = await fetch('/api/relationships', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.relationshipName,
              relationshipType: formData.relationshipType,
              connectionQuality: 7,
              energyExchange: 'balanced',
              importance: 8,
            }),
          });
          if (!relRes.ok) throw new Error('Error al crear relación');
          
          await fetch('/api/user/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 3 }),
          });
          toast.success('¡Relación conectada!');
          break;

        case 4:
          // Completar onboarding
          await fetch('/api/user/onboarding', { method: 'PUT' });
          toast.success('¡Onboarding completado! 🎉');
          onComplete();
          return;
      }

      // Avanzar al siguiente paso
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));

    } catch (error) {
      console.error('Error en onboarding:', error);
      toast.error('Hubo un error, intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <p className="text-slate-300 text-lg">
              Este sistema te ayudará a visualizar y entender las conexiones de tu vida:
              proyectos, relaciones, y cómo fluye tu energía.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Tus Proyectos</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <Users className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Tus Relaciones</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <Eye className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Tu Coherencia</p>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                ¿Cómo te llamas?
              </label>
              <Input
                value={formData.userName}
                onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                placeholder="Tu nombre"
                className="bg-slate-800 border-slate-700 text-white text-center text-lg"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                Este será el nodo central de tu tablero 3D
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Target className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ¿En qué proyecto estás invirtiendo energía?
                </label>
                <Input
                  value={formData.projectName}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                  placeholder="Nombre del proyecto"
                  className="bg-slate-800 border-slate-700 text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción breve (opcional)
                </label>
                <Input
                  value={formData.projectDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, projectDescription: e.target.value }))}
                  placeholder="¿De qué trata?"
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombra una persona importante en tu vida
                </label>
                <Input
                  value={formData.relationshipName}
                  onChange={(e) => setFormData(prev => ({ ...prev, relationshipName: e.target.value }))}
                  placeholder="Nombre de la persona"
                  className="bg-slate-800 border-slate-700 text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo de relación
                </label>
                <select
                  value={formData.relationshipType}
                  onChange={(e) => setFormData(prev => ({ ...prev, relationshipType: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-md p-2"
                >
                  <option value="personal">Personal / Familiar</option>
                  <option value="professional">Profesional</option>
                  <option value="mentor">Mentor / Guía</option>
                  <option value="spiritual">Espiritual</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">¡Tu geometría está lista!</h3>
              <p className="text-slate-300">
                Ahora puedes ver tu tablero 3D con:
              </p>
              <ul className="text-left mt-4 space-y-2 max-w-xs mx-auto">
                <li className="flex items-center gap-2 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Tu nodo Self: <strong className="text-white">{formData.userName || 'Tú'}</strong></span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>Tu proyecto: <strong className="text-white">{formData.projectName || 'Tu proyecto'}</strong></span>
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  <span>Tu relación: <strong className="text-white">{formData.relationshipName || 'Tu conexión'}</strong></span>
                </li>
              </ul>
            </div>
            <p className="text-sm text-slate-400">
              La geometría cambiará según cómo fluya tu energía y coherencia.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-700/50">
          {onSkip && currentStep < 4 && (
            <button
              onClick={onSkip}
              aria-label="Cerrar bienvenida y continuar después"
              title="Continuar después"
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          {/* Progress */}
          <div className="flex gap-1 mb-4">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx < currentStep
                    ? 'bg-green-500'
                    : idx === currentStep
                    ? 'bg-gradient-to-r from-purple-500 to-cyan-500'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Paso {currentStep + 1} de {STEPS.length}</p>
            <h2 className="text-xl font-bold text-white">{STEPS[currentStep].title}</h2>
            <p className="text-sm text-slate-400">{STEPS[currentStep].subtitle}</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            className="text-slate-400"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Atrás
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentStep === STEPS.length - 1 ? (
              <>
                Ir al Tablero
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default OnboardingWizard;

