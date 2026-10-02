
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  Users, 
  Plus, 
  Heart,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Relationship {
  id: string;
  name: string;
  description?: string;
  relationshipType: string;
  connectionQuality: number;
  energyExchange: string;
  contactFrequency?: string;
  importance?: number;
  tags: string[];
  lastInteraction?: Date;
}

export function RelationshipsMap() {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    name: '',
    description: '',
    relationshipType: 'personal',
    connectionQuality: 5,
    energyExchange: 'balanced'
  });

  useEffect(() => {
    fetchRelationships();
  }, []);

  const handleAddRelationship = async () => {
    if (!newRelationship.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRelationship)
      });

      if (response.ok) {
        await fetchRelationships();
        setNewRelationship({
          name: '',
          description: '',
          relationshipType: 'personal',
          connectionQuality: 5,
          energyExchange: 'balanced'
        });
        setShowAddForm(false);
        toast.success('Relación agregada');
      } else {
        toast.error('Error al agregar relación');
      }
    } catch (error) {
      console.error('Error adding relationship:', error);
      toast.error('Error al agregar relación');
    }
  };

  const fetchRelationships = async () => {
    try {
      const response = await fetch('/api/relationships');
      if (response.ok) {
        const data = await response.json();
        const processedRelationships = data.map((rel: any) => ({
          ...rel,
          lastInteraction: rel.lastInteraction ? new Date(rel.lastInteraction) : null
        }));
        setRelationships(processedRelationships);
      }
    } catch (error) {
      console.error('Error obteniendo relaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEnergyExchangeIcon = (exchange: string) => {
    switch (exchange) {
      case 'giving':
        return <ArrowUp className="h-4 w-4 text-blue-400" />;
      case 'receiving':
        return <ArrowDown className="h-4 w-4 text-green-400" />;
      case 'balanced':
        return <ArrowUpDown className="h-4 w-4 text-purple-400" />;
      case 'draining':
        return <Minus className="h-4 w-4 text-red-400" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
  };

  const getEnergyExchangeColor = (exchange: string) => {
    switch (exchange) {
      case 'giving':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'receiving':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'balanced':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'draining':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case 'mentor':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'personal':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'professional':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'spiritual':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'family':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getConnectionQualityColor = (quality: number) => {
    if (quality >= 8) return 'text-green-400';
    if (quality >= 6) return 'text-yellow-400';
    if (quality >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getFrequencyBadgeColor = (frequency?: string) => {
    switch (frequency) {
      case 'daily':
        return 'bg-green-500/20 text-green-300';
      case 'weekly':
        return 'bg-blue-500/20 text-blue-300';
      case 'monthly':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'occasional':
        return 'bg-orange-500/20 text-orange-300';
      case 'rare':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const relationshipTypes = [...new Set(relationships.map(r => r.relationshipType))];
  const filteredRelationships = filter === 'all' 
    ? relationships 
    : relationships.filter(r => r.relationshipType === filter);

  // Calcular estadísticas
  const stats = {
    total: relationships.length,
    highQuality: relationships.filter(r => r.connectionQuality >= 8).length,
    balanced: relationships.filter(r => r.energyExchange === 'balanced').length,
    avgQuality: relationships.length > 0 
      ? Math.round(relationships.reduce((sum, r) => sum + r.connectionQuality, 0) / relationships.length * 10) / 10
      : 0
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/30 border-pink-500/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="h-8 w-8 text-pink-400" />
            Mapa Relacional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-pulse text-slate-400">Mapeando conexiones...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 to-pink-900/30 border-pink-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
            <Users className="h-8 w-8 text-pink-400" />
            Mapa Relacional
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            aria-label="Agregar relación"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-pink-300 hover:text-pink-100 hover:bg-pink-500/20"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Formulario para agregar relación */}
        {showAddForm && (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-pink-500/20 space-y-3">
            <Input
              placeholder="Nombre de la persona"
              value={newRelationship.name}
              onChange={(e) => setNewRelationship(prev => ({ ...prev, name: e.target.value }))}
              className="bg-slate-700/50 border-slate-600 text-slate-200"
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={newRelationship.description}
              onChange={(e) => setNewRelationship(prev => ({ ...prev, description: e.target.value }))}
              className="bg-slate-700/50 border-slate-600 text-slate-200"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newRelationship.relationshipType}
                onChange={(e) => setNewRelationship(prev => ({ ...prev, relationshipType: e.target.value }))}
                className="bg-slate-700/50 border border-slate-600 text-slate-200 rounded-md p-2 text-sm"
              >
                <option value="personal">Personal</option>
                <option value="professional">Profesional</option>
                <option value="spiritual">Espiritual</option>
                <option value="mentor">Mentor</option>
                <option value="family">Familia</option>
              </select>
              <select
                value={newRelationship.energyExchange}
                onChange={(e) => setNewRelationship(prev => ({ ...prev, energyExchange: e.target.value }))}
                className="bg-slate-700/50 border border-slate-600 text-slate-200 rounded-md p-2 text-sm"
              >
                <option value="balanced">Equilibrado</option>
                <option value="giving">Dando</option>
                <option value="receiving">Recibiendo</option>
                <option value="draining">Drenante</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Calidad de conexión</span>
                <span className="text-pink-400">{newRelationship.connectionQuality}/10</span>
              </div>
              <Slider
                value={[newRelationship.connectionQuality]}
                onValueChange={(v) => setNewRelationship(prev => ({ ...prev, connectionQuality: v[0] }))}
                max={10}
                min={1}
                step={1}
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
                onClick={handleAddRelationship}
                className="bg-pink-600 hover:bg-pink-700"
              >
                Agregar
              </Button>
            </div>
          </div>
        )}

        {/* Filtros por Tipo */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' 
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' 
              : 'text-slate-400 hover:text-slate-200'
            }
          >
            Todos ({relationships.length})
          </Button>
          {relationshipTypes.map(type => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter(type)}
              className={filter === type 
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white' 
                : 'text-slate-400 hover:text-slate-200'
              }
            >
              {type} ({relationships.filter(r => r.relationshipType === type).length})
            </Button>
          ))}
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-pink-400">{stats.highQuality}</div>
            <div className="text-xs text-slate-400">Alta Calidad</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{stats.balanced}</div>
            <div className="text-xs text-slate-400">Equilibradas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">{stats.avgQuality}</div>
            <div className="text-xs text-slate-400">Calidad Promedio</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredRelationships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRelationships
                .sort((a, b) => b.connectionQuality - a.connectionQuality)
                .slice(0, 9)
                .map((relationship, index) => (
                <div
                  key={relationship.id}
                  className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/30 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300"
                >
                  {/* Header de la Relación */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-200 truncate">
                          {relationship.name}
                        </h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRelationshipTypeColor(relationship.relationshipType)}`}
                        >
                          {relationship.relationshipType}
                        </Badge>
                      </div>
                      
                      {relationship.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                          {relationship.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Calidad de Conexión */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-pink-400" />
                        <span className="text-sm text-slate-300">Calidad de Conexión</span>
                      </div>
                      <span className={`text-lg font-bold ${getConnectionQualityColor(relationship.connectionQuality)}`}>
                        {relationship.connectionQuality}/10
                      </span>
                    </div>
                    <Progress 
                      value={relationship.connectionQuality * 10} 
                      className="h-2 bg-slate-700"
                    />
                  </div>

                  {/* Intercambio Energético */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-300">Flujo Energético:</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getEnergyExchangeColor(relationship.energyExchange)}`}
                    >
                      <span className="flex items-center gap-1">
                        {getEnergyExchangeIcon(relationship.energyExchange)}
                        {relationship.energyExchange}
                      </span>
                    </Badge>
                  </div>

                  {/* Métricas Adicionales */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      {relationship.contactFrequency && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getFrequencyBadgeColor(relationship.contactFrequency)}`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {relationship.contactFrequency}
                        </Badge>
                      )}

                      {relationship.importance && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-400" />
                          <span className="text-yellow-400 font-medium">
                            {relationship.importance}/10
                          </span>
                        </div>
                      )}
                    </div>

                    {relationship.lastInteraction && (
                      <div className="text-slate-400 text-xs">
                        Último contacto: {relationship.lastInteraction.toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {relationship.tags && relationship.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-3 pt-3 border-t border-slate-700/50">
                      {relationship.tags.slice(0, 3).map((tag, tagIndex) => (
                        <Badge 
                          key={tagIndex} 
                          variant="secondary" 
                          className="text-xs bg-slate-700/50 text-slate-300"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {relationship.tags.length > 3 && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs bg-slate-700/50 text-slate-300"
                        >
                          +{relationship.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-6 text-center text-slate-300">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/15 text-pink-300">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {filter !== 'all' ? `No hay relaciones del tipo ${filter}` : 'Agrega tu primera relación'}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                Añade a una persona que influye en tu energía o decisiones. Después podrás ver calidad de conexión, balance de intercambio y frecuencia de contacto.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-pink-200">
                {['Aliado', 'Cliente', 'Mentor', 'Familia'].map(example => (
                  <span key={example} className="rounded-full border border-pink-400/20 bg-pink-400/10 px-3 py-1">
                    {example}
                  </span>
                ))}
              </div>
              <Button
                onClick={() => setShowAddForm(true)}
                className="mt-5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar primera relación
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
