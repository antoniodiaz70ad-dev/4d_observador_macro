'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Star } from 'lucide-react';
import { toast } from 'sonner';

interface DailyEntryFormProps {
  onSuccess?: () => void;
  initialData?: any;
  entryId?: string;
}

const toLocalDateInputValue = (value: Date | string = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
};

export function DailyEntryForm({ onSuccess, initialData, entryId }: DailyEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [intentions, setIntentions] = useState<any[]>([]);
  const [selectedIntentions, setSelectedIntentions] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    date: toLocalDateInputValue(),
    emotionalState: 5,
    energyLevel: 5,
    sleepQuality: 3,
    significantEvents: '',
    mainThoughts: '',
    observations: '',
    synchronicities: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: toLocalDateInputValue(initialData.date),
        emotionalState: initialData.emotionalState || 5,
        energyLevel: initialData.energyLevel || 5,
        sleepQuality: initialData.sleepQuality || 3,
        significantEvents: initialData.significantEvents || '',
        mainThoughts: initialData.mainThoughts || '',
        observations: initialData.observations || '',
        synchronicities: initialData.synchronicities || '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    loadIntentions();
    loadQuestions();
  }, []);

  const loadIntentions = async () => {
    try {
      const res = await fetch('/api/daily-mapping/intentions?status=active');
      if (res.ok) {
        const data = await res.json();
        setIntentions(data);
      }
    } catch (error) {
      console.error('Error loading intentions:', error);
    }
  };

  const loadQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch('/api/daily-mapping/questions', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = entryId 
        ? `/api/daily-mapping/entries/${entryId}`
        : '/api/daily-mapping/entries';
      
      const method = entryId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          intentionIds: selectedIntentions,
        }),
      });

      if (!res.ok) throw new Error('Failed to save entry');

      toast.success(entryId ? 'Entrada actualizada' : 'Entrada guardada exitosamente');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Error al guardar la entrada');
    } finally {
      setLoading(false);
    }
  };

  const toggleIntention = (id: string) => {
    setSelectedIntentions(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Reflective Questions */}
      {questions.length > 0 && (
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              Preguntas Reflexivas del Día
            </CardTitle>
            <CardDescription>
              Reflexiona sobre estas preguntas mientras registras tu día
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingQuestions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              </div>
            ) : (
              <ul className="space-y-3">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-purple-400 font-bold">{i + 1}.</span>
                    <span className="text-gray-200">{q}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={loadQuestions}
              disabled={loadingQuestions}
            >
              {loadingQuestions ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generar Nuevas Preguntas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Registro Diario</CardTitle>
            <CardDescription>
              Observa tu día desde la perspectiva 4D
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            {/* Emotional State Slider */}
            <div className="space-y-3">
              <Label>Estado Emocional: {formData.emotionalState}/10</Label>
              <Slider
                value={[formData.emotionalState]}
                onValueChange={([value]) => setFormData({ ...formData, emotionalState: value })}
                min={1}
                max={10}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Bajo</span>
                <span>Medio</span>
                <span>Alto</span>
              </div>
            </div>

            {/* Energy Level Slider */}
            <div className="space-y-3">
              <Label>Nivel de Energía: {formData.energyLevel}/10</Label>
              <Slider
                value={[formData.energyLevel]}
                onValueChange={([value]) => setFormData({ ...formData, energyLevel: value })}
                min={1}
                max={10}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Agotado</span>
                <span>Normal</span>
                <span>Energizado</span>
              </div>
            </div>

            {/* Sleep Quality */}
            <div className="space-y-3">
              <Label>Calidad del Sueño</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, sleepQuality: rating })}
                    className="transition-colors"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= formData.sleepQuality
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Significant Events */}
            <div className="space-y-2">
              <Label htmlFor="events">Eventos Significativos</Label>
              <Textarea
                id="events"
                value={formData.significantEvents}
                onChange={(e) => setFormData({ ...formData, significantEvents: e.target.value })}
                placeholder="¿Qué sucedió hoy que fue importante?"
                rows={3}
              />
            </div>

            {/* Main Thoughts */}
            <div className="space-y-2">
              <Label htmlFor="thoughts">Pensamientos Principales</Label>
              <Textarea
                id="thoughts"
                value={formData.mainThoughts}
                onChange={(e) => setFormData({ ...formData, mainThoughts: e.target.value })}
                placeholder="¿Qué pensamientos destacaron hoy?"
                rows={3}
              />
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones desde 4D</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                placeholder="Desde tu perspectiva de observador, ¿qué notaste?"
                rows={3}
              />
            </div>

            {/* Synchronicities */}
            <div className="space-y-2">
              <Label htmlFor="sync">Sincronicidades</Label>
              <Textarea
                id="sync"
                value={formData.synchronicities}
                onChange={(e) => setFormData({ ...formData, synchronicities: e.target.value })}
                placeholder="¿Notaste alguna sincronicidad o señal?"
                rows={2}
              />
            </div>

            {/* Intentions Fulfilled */}
            {intentions.length > 0 && (
              <div className="space-y-3">
                <Label>Intenciones Cumplidas Hoy</Label>
                <div className="flex flex-wrap gap-2">
                  {intentions.map((intention) => (
                    <Badge
                      key={intention.id}
                      variant={selectedIntentions.includes(intention.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleIntention(intention.id)}
                    >
                      {intention.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>Guardar Entrada</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
