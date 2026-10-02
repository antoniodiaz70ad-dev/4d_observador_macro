
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Sparkles, 
  Target,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, isAfter, isBefore, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  type: 'event' | 'decision' | 'project' | 'manifestation';
  date: Date;
  timeline: 'past' | 'present' | 'future';
  progress?: number;
  category?: string;
  impact?: number;
  timeframe?: string;
}

interface TimelineData {
  events: TimelineEvent[];
  summary: {
    pastEventsCount: number;
    futureEventsCount: number;
    activeProjectsCount: number;
    manifestationsCount: number;
  };
}

export function TimelineViewer() {
  const [timelineData, setTimelineData] = useState<TimelineData>({
    events: [],
    summary: {
      pastEventsCount: 0,
      futureEventsCount: 0,
      activeProjectsCount: 0,
      manifestationsCount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'past' | 'present' | 'future'>('present');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'event' as 'event' | 'decision' | 'project' | 'manifestation',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTimelineData();
  }, []);

  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      const eventDate = new Date(newEvent.date);
      const timeline = determineTimeline(eventDate);

      const response = await fetch('/api/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          type: newEvent.type,
          date: newEvent.date,
          timeline: timeline
        })
      });

      if (response.ok) {
        const savedEvent = await response.json();
        
        // Refresh timeline data
        await fetchTimelineData();

        setNewEvent({
          title: '',
          description: '',
          type: 'event',
          date: new Date().toISOString().split('T')[0]
        });
        setShowAddForm(false);
        toast.success('Evento guardado en la base de datos');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al guardar evento');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Error al agregar evento');
    }
  };

  const fetchTimelineData = async () => {
    try {
      const response = await fetch('/api/timeline');
      if (response.ok) {
        const data = await response.json();
        // Procesar fechas y determinar timeline
        const processedEvents = data.events.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          timeline: determineTimeline(new Date(event.date))
        }));
        
        setTimelineData({
          events: processedEvents,
          summary: data.summary
        });
      }
    } catch (error) {
      console.error('Error obteniendo timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineTimeline = (date: Date): 'past' | 'present' | 'future' => {
    const now = new Date();
    if (isToday(date)) return 'present';
    if (isBefore(date, now)) return 'past';
    return 'future';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Target className="h-4 w-4" />;
      case 'manifestation':
        return <Sparkles className="h-4 w-4" />;
      case 'decision':
        return <Star className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string, timeline: string) => {
    const baseColors = {
      project: timeline === 'past' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-500/30 text-blue-200 border-blue-400/40',
      manifestation: timeline === 'past' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-500/30 text-purple-200 border-purple-400/40',
      decision: timeline === 'past' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-green-500/30 text-green-200 border-green-400/40',
      event: timeline === 'past' ? 'bg-gray-500/20 text-gray-300 border-gray-500/30' : 'bg-gray-500/30 text-gray-200 border-gray-400/40'
    };
    return baseColors[type as keyof typeof baseColors] || baseColors.event;
  };

  const filteredEvents = timelineData.events.filter(event => {
    if (selectedPeriod === 'present') {
      return isToday(event.date);
    }
    return event.timeline === selectedPeriod;
  }).sort((a, b) => {
    if (selectedPeriod === 'past') {
      return b.date.getTime() - a.date.getTime(); // Más reciente primero para el pasado
    }
    return a.date.getTime() - b.date.getTime(); // Más próximo primero para el futuro
  });

  const getTimelineTitle = () => {
    switch (selectedPeriod) {
      case 'past':
        return '🕰️ Pasado';
      case 'present':
        return '✨ Presente';
      case 'future':
        return '🚀 Futuro';
      default:
        return '📅 Timeline';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-indigo-900/30 border-indigo-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-400" />
            Timeline Cuántico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse text-slate-400">Cargando línea temporal...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-indigo-900/30 border-indigo-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-400" />
            Timeline Cuántico
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            aria-label="Agregar evento al timeline"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-indigo-300 hover:text-indigo-100 hover:bg-indigo-500/20"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Formulario para agregar evento */}
        {showAddForm && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-indigo-500/20 space-y-3">
            <Input
              placeholder="Título del evento"
              value={newEvent.title}
              onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
              className="bg-slate-700/50 border-slate-600 text-slate-200"
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={newEvent.description}
              onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              className="bg-slate-700/50 border-slate-600 text-slate-200"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                className="bg-slate-700/50 border border-slate-600 text-slate-200 rounded-md p-2 text-sm"
              >
                <option value="event">Evento</option>
                <option value="decision">Decisión</option>
                <option value="project">Proyecto</option>
                <option value="manifestation">Manifestación</option>
              </select>
              <Input
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-slate-200"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleAddEvent}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Agregar
              </Button>
            </div>
          </div>
        )}
        
        {/* Navegación de Período */}
        <div className="flex items-center justify-center gap-1 bg-slate-800/50 rounded-lg p-1">
          <Button
            variant={selectedPeriod === 'past' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPeriod('past')}
            className={selectedPeriod === 'past' 
              ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white' 
              : 'text-slate-400 hover:text-slate-200'
            }
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Pasado
          </Button>
          <Button
            variant={selectedPeriod === 'present' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPeriod('present')}
            className={selectedPeriod === 'present' 
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
              : 'text-slate-400 hover:text-slate-200'
            }
          >
            Presente
          </Button>
          <Button
            variant={selectedPeriod === 'future' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedPeriod('future')}
            className={selectedPeriod === 'future' 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
              : 'text-slate-400 hover:text-slate-200'
            }
          >
            Futuro
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-slate-200 mb-2">
              {getTimelineTitle()}
            </h3>
            <div className="text-sm text-slate-400">
              {filteredEvents.length} eventos
            </div>
          </div>

          {/* Lista de Eventos */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEvents.length > 0 ? (
              filteredEvents.slice(0, 6).map((event, index) => (
                <div
                  key={event.id}
                  className={`relative p-4 rounded-lg border backdrop-blur-sm hover:shadow-lg hover:scale-105 transition-all duration-300 ${getEventColor(event.type, event.timeline)}`}
                >
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-current/20 rounded-full flex items-center justify-center">
                      {getEventIcon(event.type)}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-200 truncate">
                          {event.title}
                        </h4>
                        <Badge variant="outline" className="text-xs border-current/30 text-current">
                          {event.type}
                        </Badge>
                        {event.category && (
                          <Badge variant="outline" className="text-xs border-current/30 text-current">
                            {event.category}
                          </Badge>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-slate-400">
                          {format(event.date, 'dd MMM yyyy', { locale: es })}
                        </div>
                        
                        {event.progress !== undefined && (
                          <div className="text-current font-medium">
                            {Math.round(event.progress)}%
                          </div>
                        )}
                        
                        {event.impact && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            <span>{event.impact}/10</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-center text-slate-300">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
                  <Calendar className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-white">No hay eventos en este período</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                  Registra una decisión, señal, avance o fecha importante. El timeline convierte tus acciones sueltas en una historia fácil de revisar.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-indigo-200">
                  {['Decisión', 'Señal', 'Meta', 'Resultado'].map(example => (
                    <span key={example} className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1">
                      {example}
                    </span>
                  ))}
                </div>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="mt-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar evento
                </Button>
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">
                {timelineData.summary.pastEventsCount}
              </div>
              <div className="text-xs text-slate-400">Eventos Pasados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {timelineData.summary.futureEventsCount}
              </div>
              <div className="text-xs text-slate-400">Eventos Futuros</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
