
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { 
  Target, 
  Plus, 
  Play, 
  Pause, 
  CheckCircle,
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: string;
  progress: number;
  energyInvested: number;
  targetDate?: Date;
  impactLevel?: number;
  satisfactionLevel?: number;
}

export function ProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('active');
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    category: 'personal',
    energyInvested: 5,
    impactLevel: 5,
    targetDate: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        const processedProjects = data.map((project: any) => ({
          ...project,
          targetDate: project.targetDate ? new Date(project.targetDate) : null
        }));
        setProjects(processedProjects);
      }
    } catch (error) {
      console.error('Error obteniendo proyectos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: projectId,
          status: newStatus
        })
      });

      if (response.ok) {
        await fetchProjects();
        toast.success('Proyecto actualizado');
      }
    } catch (error) {
      console.error('Error actualizando proyecto:', error);
      toast.error('Error al actualizar proyecto');
    }
  };

  const createProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('El nombre del proyecto es requerido');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newProject,
          targetDate: newProject.targetDate || null
        })
      });

      if (response.ok) {
        await fetchProjects();
        setShowDialog(false);
        setNewProject({
          name: '',
          description: '',
          category: 'personal',
          energyInvested: 5,
          impactLevel: 5,
          targetDate: ''
        });
        toast.success('Proyecto creado exitosamente');
      } else {
        toast.error('Error al crear proyecto');
      }
    } catch (error) {
      console.error('Error creando proyecto:', error);
      toast.error('Error al crear proyecto');
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      all: 'Todos',
      active: 'Activo',
      paused: 'Pausado',
      completed: 'Completado',
      cancelled: 'Cancelado',
    };
    return labels[status] || status.replace(/_/g, ' ');
  };

  const getStatusPluralLabel = (status: string) => {
    const labels: Record<string, string> = {
      all: 'Todos',
      active: 'Activos',
      paused: 'Pausados',
      completed: 'Completados',
      cancelled: 'Cancelados',
    };
    return labels[status] || getStatusLabel(status);
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      personal: 'Personal',
      professional: 'Profesional',
      spiritual: 'Espiritual',
      health: 'Salud',
      relationships: 'Relaciones',
      financial: 'Financiero',
    };
    return category ? (labels[category] || category.replace(/_/g, ' ')) : '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'spiritual':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'professional':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'personal':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getEnergyColor = (energy: number) => {
    if (energy >= 8) return 'text-red-400';
    if (energy >= 6) return 'text-orange-400';
    if (energy >= 4) return 'text-yellow-400';
    return 'text-green-400';
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const projectStats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    avgProgress: projects.length > 0 
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-cyan-900/30 border-cyan-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
            <Target className="h-8 w-8 text-cyan-400" />
            Proyectos 4D
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse text-slate-400">Cargando proyectos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-cyan-900/30 border-cyan-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-3">
            <Target className="h-8 w-8 text-cyan-400" />
            Proyectos 4D
          </CardTitle>
        </div>

        {/* Botón Crear Proyecto Destacado */}
        <Button 
          onClick={() => setShowDialog(true)}
          aria-label="Agregar proyecto"
          className="w-full mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuevo Proyecto 4D
        </Button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <div className="text-2xl font-bold text-cyan-400">{projectStats.active}</div>
            <div className="text-xs text-slate-400">Activos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">{projectStats.completed}</div>
            <div className="text-xs text-slate-400">Completados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{projectStats.avgProgress}%</div>
            <div className="text-xs text-slate-400">Progreso promedio</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'paused', 'completed'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(status)}
              className={filter === status 
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white' 
                : 'text-slate-400 hover:text-slate-200'
              }
            >
              {getStatusPluralLabel(status)}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
                >
                  {/* Header del Proyecto */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-200 truncate">
                          {project.name}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(project.status)}`}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(project.status)}
                            {getStatusLabel(project.status)}
                          </span>
                        </Badge>
                      </div>
                      
                      {project.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Progreso</span>
                      <span className="text-sm font-bold text-cyan-400">
                        {Math.round(project.progress)}%
                      </span>
                    </div>
                    <Progress 
                      value={project.progress} 
                      className="h-2 bg-slate-700"
                    />
                  </div>

                  {/* Métricas */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      {project.category && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getCategoryColor(project.category)}`}
                        >
                          {getCategoryLabel(project.category)}
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-400" />
                        <span className={`${getEnergyColor(project.energyInvested)} font-medium`}>
                          {project.energyInvested}/10
                        </span>
                      </div>

                      {project.impactLevel && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-purple-400" />
                          <span className="text-purple-400 font-medium">
                            {project.impactLevel}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {project.targetDate && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {project.targetDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones Rápidas */}
                  {project.status === 'active' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateProjectStatus(project.id, 'paused')}
                        className="text-yellow-300 hover:text-yellow-100 hover:bg-yellow-500/20"
                      >
                        <Pause className="h-3 w-3 mr-1" />
                        Pausar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateProjectStatus(project.id, 'completed')}
                        className="text-blue-300 hover:text-blue-100 hover:bg-blue-500/20"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completar
                      </Button>
                    </div>
                  )}

                  {project.status === 'paused' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700/50">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => updateProjectStatus(project.id, 'active')}
                        className="text-green-300 hover:text-green-100 hover:bg-green-500/20"
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Reactivar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-center text-slate-300">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                <Target className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {projects.length === 0 ? 'Crea tu primer proyecto' : `No hay proyectos en estado ${getStatusLabel(filter).toLowerCase()}`}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                Un proyecto es el primer nodo de tu mapa 4D. Puede ser un negocio, una relación, un hábito, una inversión o una meta personal que quieras observar con claridad.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-cyan-200">
                {['Negocio', 'Salud', 'Relación', 'Creatividad'].map(example => (
                  <span key={example} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1">
                    {example}
                  </span>
                ))}
              </div>
              <Button
                onClick={() => setShowDialog(true)}
                className="mt-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear primer proyecto
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Diálogo para crear proyecto */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-cyan-500/30 text-slate-100 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Nuevo Proyecto 4D
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Define un nuevo proyecto para manifestar en tu realidad 4D
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Nombre del Proyecto *
              </Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Ej: Lanzar mi negocio online"
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Describe tu proyecto y su propósito..."
                className="bg-slate-800 border-slate-700 text-slate-100 min-h-24"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-slate-200">
                Categoría
              </Label>
              <Select
                value={newProject.category}
                onValueChange={(value) => setNewProject({ ...newProject, category: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="professional">Profesional</SelectItem>
                  <SelectItem value="spiritual">Espiritual</SelectItem>
                  <SelectItem value="health">Salud</SelectItem>
                  <SelectItem value="relationships">Relaciones</SelectItem>
                  <SelectItem value="financial">Financiero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Energía Invertida */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-slate-200">Energía a Invertir</Label>
                <span className="text-sm text-cyan-400 font-medium">
                  {newProject.energyInvested}/10
                </span>
              </div>
              <Slider
                value={[newProject.energyInvested]}
                onValueChange={(value) => setNewProject({ ...newProject, energyInvested: value[0] })}
                min={1}
                max={10}
                step={1}
                className="cursor-pointer"
              />
              <p className="text-xs text-slate-400">
                ¿Cuánta energía planeas dedicar a este proyecto?
              </p>
            </div>

            {/* Nivel de Impacto */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-slate-200">Impacto Esperado</Label>
                <span className="text-sm text-purple-400 font-medium">
                  {newProject.impactLevel}/10
                </span>
              </div>
              <Slider
                value={[newProject.impactLevel]}
                onValueChange={(value) => setNewProject({ ...newProject, impactLevel: value[0] })}
                min={1}
                max={10}
                step={1}
                className="cursor-pointer"
              />
              <p className="text-xs text-slate-400">
                ¿Qué tan significativo será el impacto en tu vida?
              </p>
            </div>

            {/* Fecha Objetivo */}
            <div className="space-y-2">
              <Label htmlFor="targetDate" className="text-slate-200">
                Fecha Objetivo (Opcional)
              </Label>
              <Input
                id="targetDate"
                type="date"
                value={newProject.targetDate}
                onChange={(e) => setNewProject({ ...newProject, targetDate: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              disabled={creating}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </Button>
            <Button
              onClick={createProject}
              disabled={creating}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
            >
              {creating ? 'Creando...' : 'Crear Proyecto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
