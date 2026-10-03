'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  RefreshCw,
  Target,
  Users,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
  Move,
  Activity,
  TrendingUp,
  GitBranch,
  Lightbulb
} from 'lucide-react';

type ViewMode = 'energy' | 'strategy' | 'relational' | 'manifestations' | 'futures';

interface Node {
  id: string;
  type: 'observer' | 'project' | 'relationship' | 'manifestation' | 'energy' | 'task';
  x: number;
  y: number;
  vx: number; // velocity for floating animation
  vy: number;
  label: string;
  color: string;
  size: number;
  progress?: number;
  energy?: number;
  category?: string;
  status?: string;
  date?: Date;
  pulsePhase?: number;
}

interface Connection {
  from: string;
  to: string;
  energy: number;
  animated: boolean;
  flowSpeed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface GameBoardProps {
  recentData: {
    projects: any[];
    relationships: any[];
    manifestations: any[];
    entries: any[];
  };
}

export default function GameBoard({ recentData }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('energy');
  
  // Camera/viewport state
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    processData();
  }, [recentData, viewMode]);

  // Main animation loop - 60fps
  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;
      
      setAnimationFrame(f => (f + 1) % 360);
      
      // Update node positions (floating animation)
      setNodes(prevNodes => 
        prevNodes.map(node => {
          if (node.type === 'observer') return node;
          
          const floatSpeed = 0.2;
          let newX = node.x + node.vx * deltaTime * 10;
          let newY = node.y + node.vy * deltaTime * 10;
          let newVx = node.vx;
          let newVy = node.vy;
          
          // Keep nodes in bounds
          const radius = node.type === 'project' ? 250 : node.type === 'relationship' ? 400 : 180;
          const distance = Math.sqrt(newX * newX + newY * newY);
          
          if (distance > radius) {
            const angle = Math.atan2(newY, newX);
            newVx = -Math.cos(angle) * floatSpeed;
            newVy = -Math.sin(angle) * floatSpeed;
          }
          
          return {
            ...node,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            pulsePhase: ((node.pulsePhase || 0) + deltaTime * 2) % (Math.PI * 2)
          };
        })
      );
      
      // Update particles
      setParticles(prevParticles => {
        const updated = prevParticles
          .map(p => ({
            ...p,
            x: p.x + p.vx * deltaTime * 20,
            y: p.y + p.vy * deltaTime * 20,
            life: p.life - deltaTime
          }))
          .filter(p => p.life > 0);
        
        // Add new particles randomly
        if (updated.length < 50 && Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * 300;
          updated.push({
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 2 + Math.random() * 3,
            color: ['#a855f7', '#06b6d4', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)],
            size: 1 + Math.random() * 2
          });
        }
        
        return updated;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Render loop
  useEffect(() => {
    if (nodes.length > 0) {
      renderCanvas();
    }
  }, [nodes, connections, particles, zoom, panX, panY, viewMode, animationFrame, selectedNode]);

  const processData = () => {
    const projects = recentData?.projects || [];
    const relationships = recentData?.relationships || [];
    const manifestations = recentData?.manifestations || [];

    // Nodo del Observador (centro absoluto)
    const generatedNodes: Node[] = [
      {
        id: 'observer',
        type: 'observer',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        label: 'YO',
        color: '#a855f7',
        size: 35,
        progress: 100,
        energy: 10,
        pulsePhase: 0
      }
    ];

    const newConnections: Connection[] = [];

    // No se agregan nodos demostrativos: el conteo debe reflejar datos reales del usuario.


    // Process real projects
    projects.forEach((project: any, index: number) => {
      const angle = (index / Math.max(projects.length, 1)) * Math.PI * 2 + Math.random() * 0.2;
      const radius = viewMode === 'strategy' ? 240 : 220;
      const nodeId = `project-${project.id}`;
      
      generatedNodes.push({
        id: nodeId,
        type: 'project',
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        label: project.name,
        color: getProjectColor(project.category, project.status),
        size: 16 + ((project.energyInvested || 5) * 1.2),
        progress: project.progress,
        energy: project.energyInvested,
        category: project.category,
        status: project.status,
        pulsePhase: Math.random() * Math.PI * 2
      });

      newConnections.push({
        from: 'observer',
        to: nodeId,
        energy: project.energyInvested || 5,
        animated: project.status === 'active',
        flowSpeed: project.status === 'active' ? 1.5 : 0.5
      });
    });

    // Process relationships
    relationships.forEach((rel: any, index: number) => {
      const angle = ((index / Math.max(relationships.length, 1)) * Math.PI * 2) + Math.PI / 6;
      const radius = viewMode === 'relational' ? 320 : 380;
      const nodeId = `rel-${rel.id}`;
      
      generatedNodes.push({
        id: nodeId,
        type: 'relationship',
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        label: rel.name,
        color: '#f59e0b',
        size: 14 + ((rel.strength || 5) * 1.5),
        energy: rel.strength,
        pulsePhase: Math.random() * Math.PI * 2
      });

      newConnections.push({
        from: 'observer',
        to: nodeId,
        energy: rel.strength || 5,
        animated: true,
        flowSpeed: 1.2
      });
    });

    // Process manifestations
    manifestations.forEach((man: any, index: number) => {
      const angle = ((index / Math.max(manifestations.length, 1)) * Math.PI * 2) - Math.PI / 3;
      const radius = viewMode === 'manifestations' ? 180 : 160;
      const nodeId = `man-${man.id}`;
      
      generatedNodes.push({
        id: nodeId,
        type: 'manifestation',
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        label: man.title || 'Manifestación',
        color: '#10b981',
        size: 12 + (Math.random() * 4),
        date: man.manifestedAt ? new Date(man.manifestedAt) : undefined,
        pulsePhase: Math.random() * Math.PI * 2
      });

      newConnections.push({
        from: 'observer',
        to: nodeId,
        energy: 7,
        animated: true,
        flowSpeed: 1.8
      });
    });

    setNodes(generatedNodes);
    setConnections(newConnections);
  };

  const getNodeColor = (type: string, category?: string): string => {
    if (type === 'energy') return '#fbbf24';
    if (type === 'task') return '#06b6d4';
    if (type === 'project') return getProjectColor(category);
    if (type === 'relationship') return '#f59e0b';
    if (type === 'manifestation') return '#10b981';
    return '#a855f7';
  };

  const getProjectColor = (category?: string, status?: string): string => {
    if (status === 'completed') return '#10b981';
    if (status === 'paused') return '#64748b';
    
    switch (category) {
      case 'spiritual': return '#a855f7';
      case 'professional': return '#06b6d4';
      case 'personal': return '#f59e0b';
      case 'health': return '#ef4444';
      case 'relationships': return '#ec4899';
      case 'financial': return '#22c55e';
      default: return '#06b6d4';
    }
  };

  const worldToScreen = (worldX: number, worldY: number, canvas: HTMLCanvasElement) => {
    const centerX = canvas.width / (2 * window.devicePixelRatio);
    const centerY = canvas.height / (2 * window.devicePixelRatio);
    return {
      x: centerX + (worldX + panX) * zoom,
      y: centerY + (worldY + panY) * zoom
    };
  };

  const screenToWorld = (screenX: number, screenY: number, canvas: HTMLCanvasElement) => {
    const centerX = canvas.width / (2 * window.devicePixelRatio);
    const centerY = canvas.height / (2 * window.devicePixelRatio);
    return {
      x: (screenX - centerX) / zoom - panX,
      y: (screenY - centerY) / zoom - panY
    };
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar tamaño del canvas
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // 1. Fondo premium con nebulosa y grid holográfico
    drawPremiumBackground(ctx, width, height);

    // 2. Sistema de partículas energéticas
    drawParticles(ctx, canvas);

    // 3. Conexiones energéticas dinámicas
    drawConnections(ctx, canvas);

    // 4. Nodos con efectos premium
    drawNodes(ctx, canvas);
  };

  const drawPremiumBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    
    // ═══════════════════════════════════════════════════════════
    // CAPA 1: FONDO CÓSMICO PROFUNDO (parallax más lento)
    // ═══════════════════════════════════════════════════════════
    const parallax1X = panX * 0.05; // Movimiento muy lento
    const parallax1Y = panY * 0.05;
    
    // Base: espacio profundo con degradado radial
    const bgGradient = ctx.createRadialGradient(
      width / 2 + parallax1X, 
      height / 2 + parallax1Y, 
      0, 
      width / 2 + parallax1X, 
      height / 2 + parallax1Y, 
      width / 1.5
    );
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(0.5, '#0f0f1e');
    bgGradient.addColorStop(1, '#050510');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Nebulosa sutil con movimiento parallax
    const nebula1 = ctx.createRadialGradient(
      width * 0.3 + parallax1X * 2, 
      height * 0.4 + parallax1Y * 2, 
      0, 
      width * 0.3 + parallax1X * 2, 
      height * 0.4 + parallax1Y * 2, 
      width * 0.6
    );
    nebula1.addColorStop(0, 'rgba(168, 85, 247, 0.1)');
    nebula1.addColorStop(0.5, 'rgba(168, 85, 247, 0.04)');
    nebula1.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = nebula1;
    ctx.fillRect(0, 0, width, height);

    const nebula2 = ctx.createRadialGradient(
      width * 0.7 + parallax1X * 1.5, 
      height * 0.6 + parallax1Y * 1.5, 
      0, 
      width * 0.7 + parallax1X * 1.5, 
      height * 0.6 + parallax1Y * 1.5, 
      width * 0.5
    );
    nebula2.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
    nebula2.addColorStop(0.5, 'rgba(6, 182, 212, 0.03)');
    nebula2.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, width, height);

    // ═══════════════════════════════════════════════════════════
    // CAPA 2: GRID HOLOGRÁFICO CON RELIEVE (parallax medio)
    // ═══════════════════════════════════════════════════════════
    const parallax2X = panX * 0.3; // Movimiento medio
    const parallax2Y = panY * 0.3;
    
    const gridSize = 60 * zoom;
    const offsetX = ((panX * zoom + parallax2X) % gridSize) + width / 2;
    const offsetY = ((panY * zoom + parallax2Y) % gridSize) + height / 2;
    const center = worldToScreen(0, 0, canvasRef.current!);
    
    // Grid principal con brillo desde el centro (relieve aéreo)
    for (let x = offsetX % gridSize; x < width; x += gridSize) {
      const distanceFromCenter = Math.abs(x - center.x) / width;
      const centralBrightness = Math.max(0.05, 0.25 - distanceFromCenter * 0.3);
      
      const gradient = ctx.createLinearGradient(x, 0, x, height);
      gradient.addColorStop(0, `rgba(168, 85, 247, ${centralBrightness * 0.4})`);
      gradient.addColorStop(0.5, `rgba(168, 85, 247, ${centralBrightness})`);
      gradient.addColorStop(1, `rgba(168, 85, 247, ${centralBrightness * 0.4})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = distanceFromCenter < 0.3 ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = offsetY % gridSize; y < height; y += gridSize) {
      const distanceFromCenter = Math.abs(y - center.y) / height;
      const centralBrightness = Math.max(0.05, 0.25 - distanceFromCenter * 0.3);
      
      const gradient = ctx.createLinearGradient(0, y, width, y);
      gradient.addColorStop(0, `rgba(168, 85, 247, ${centralBrightness * 0.4})`);
      gradient.addColorStop(0.5, `rgba(168, 85, 247, ${centralBrightness})`);
      gradient.addColorStop(1, `rgba(168, 85, 247, ${centralBrightness * 0.4})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = distanceFromCenter < 0.3 ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Grid secundario ultra-fino con desvanecimiento
    const smallGridSize = gridSize / 4;
    ctx.lineWidth = 0.5;
    
    for (let x = offsetX % smallGridSize; x < width; x += smallGridSize) {
      const distanceFromCenter = Math.abs(x - center.x) / width;
      ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0.02, 0.08 - distanceFromCenter * 0.06)})`;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = offsetY % smallGridSize; y < height; y += smallGridSize) {
      const distanceFromCenter = Math.abs(y - center.y) / height;
      ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0.02, 0.08 - distanceFromCenter * 0.06)})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Anillos concéntricos con efecto de territorio (relieve radial)
    const rings = [120, 220, 320, 420];
    
    rings.forEach((radius, idx) => {
      const scaledRadius = radius * zoom;
      const alpha = 0.12 - (idx * 0.02);
      const pulse = Math.sin(animationFrame / 30 + idx) * 0.04;
      
      // Anillo con brillo hacia dentro
      ctx.strokeStyle = `rgba(168, 85, 247, ${alpha + pulse})`;
      ctx.lineWidth = idx === 0 ? 2.5 : 2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.arc(center.x, center.y, scaledRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Glow del anillo para profundidad
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.4)';
      ctx.strokeStyle = `rgba(168, 85, 247, ${alpha * 0.5})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(center.x, center.y, scaledRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Líneas de campo energético radiantes con profundidad
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + (animationFrame / 180);
      const x1 = center.x + Math.cos(angle) * 80 * zoom;
      const y1 = center.y + Math.sin(angle) * 80 * zoom;
      const x2 = center.x + Math.cos(angle) * 550 * zoom;
      const y2 = center.y + Math.sin(angle) * 550 * zoom;
      
      const lineGradient = ctx.createLinearGradient(x1, y1, x2, y2);
      lineGradient.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      lineGradient.addColorStop(0.3, 'rgba(6, 182, 212, 0.12)');
      lineGradient.addColorStop(0.7, 'rgba(6, 182, 212, 0.04)');
      lineGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.strokeStyle = lineGradient;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save();
    
    // ═══════════════════════════════════════════════════════════
    // CAPA 3: PARTÍCULAS ENERGÉTICAS CON PARALLAX (movimiento rápido)
    // ═══════════════════════════════════════════════════════════
    
    particles.forEach((particle, index) => {
      // Parallax en función de la posición de la partícula (más rápido que el fondo)
      const parallaxFactor = 0.8 + (index % 3) * 0.15; // Variación entre partículas
      const pos = worldToScreen(
        particle.x + panX * parallaxFactor * 0.1, 
        particle.y + panY * parallaxFactor * 0.1, 
        canvas
      );
      
      const alpha = particle.life / 5; // Fade out as life decreases
      
      // Partícula principal con sombra sutil
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = particle.color;
      ctx.shadowOffsetY = 2; // Pequeña sombra vertical
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, particle.size * zoom, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowOffsetY = 0;
      
      // Glow effect con profundidad
      ctx.globalAlpha = alpha * 0.35;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, particle.size * zoom * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Núcleo brillante (top-down lighting)
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 5;
      ctx.shadowColor = particle.color;
      ctx.beginPath();
      ctx.arc(pos.x - particle.size * zoom * 0.3, pos.y - particle.size * zoom * 0.3, particle.size * zoom * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  };

  const drawConnections = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save();
    
    connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.from);
      const toNode = nodes.find(n => n.id === conn.to);
      
      if (!fromNode || !toNode) return;

      const from = worldToScreen(fromNode.x, fromNode.y, canvas);
      const to = worldToScreen(toNode.x, toNode.y, canvas);

      // ═══════════════════════════════════════════════════════════
      // CONEXIONES CON PROFUNDIDAD Y BLUR AMBIENTAL (CAPA 3)
      // ═══════════════════════════════════════════════════════════
      
      // Calcular distancia para efecto de profundidad
      const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
      const maxDistance = 600;
      const depthFactor = Math.min(distance / maxDistance, 1);
      
      // Calcular grosor según energía e intensidad
      const baseWidth = Math.max(1.5, (conn.energy / 10) * 3);
      const pulseIntensity = conn.animated ? Math.sin(animationFrame / 20) * 0.3 + 1 : 1;
      const lineWidth = baseWidth * pulseIntensity;

      // Línea base con glow y profundidad
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, fromNode.color);
      gradient.addColorStop(0.5, `rgba(255, 255, 255, ${viewMode === 'energy' ? 0.4 : 0.2})`);
      gradient.addColorStop(1, toNode.color);
      
      // CAPA DE PROFUNDIDAD 1: Sombra difusa debajo de la línea
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = lineWidth + 6;
      ctx.globalAlpha = 0.15 * (1 - depthFactor * 0.5);
      ctx.shadowBlur = 20 + depthFactor * 15;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowOffsetY = 4; // Sombra hacia abajo
      
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      
      ctx.shadowOffsetY = 0;
      
      // CAPA DE PROFUNDIDAD 2: Glow exterior con blur ambiental
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth + 5;
      ctx.globalAlpha = (viewMode === 'energy' ? 0.2 : 0.12) * (1 - depthFactor * 0.3);
      ctx.shadowBlur = 20 + depthFactor * 10; // Más blur en distancia
      ctx.shadowColor = toNode.color;
      
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // CAPA DE PROFUNDIDAD 3: Línea principal con variación de opacidad
      ctx.shadowBlur = 10 - depthFactor * 3;
      ctx.globalAlpha = (viewMode === 'energy' ? 0.75 : 0.4) * (1 - depthFactor * 0.25);
      ctx.lineWidth = lineWidth;
      
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Core brillante
      ctx.strokeStyle = `rgba(255, 255, 255, ${viewMode === 'energy' ? 0.6 : 0.3})`;
      ctx.globalAlpha = 1;
      ctx.lineWidth = Math.max(0.5, lineWidth / 3);
      ctx.shadowBlur = 0;
      
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();

      // Partículas de flujo energético
      if (conn.animated) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const flowSpeed = conn.flowSpeed || 1;
        
        // Múltiples partículas a lo largo de la conexión
        for (let i = 0; i < 3; i++) {
          const offset = (i / 3);
          const progress = ((animationFrame * flowSpeed * 0.02 + offset) % 1);
          
          const particleX = from.x + dx * progress;
          const particleY = from.y + dy * progress;
          
          const particleSize = 3 + (conn.energy / 10) * 2;
          const particleAlpha = Math.sin(progress * Math.PI) * 0.8;
          
          // Glow de partícula
          ctx.globalAlpha = particleAlpha * 0.5;
          ctx.fillStyle = toNode.color;
          ctx.shadowBlur = 12;
          ctx.shadowColor = toNode.color;
          
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize * 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Core de partícula
          ctx.globalAlpha = particleAlpha;
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 6;
          
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    
    ctx.restore();
  };

  const drawNodes = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save();
    
    nodes.forEach(node => {
      const pos = worldToScreen(node.x, node.y, canvas);
      const isSelected = selectedNode === node.id;
      const radius = node.size * zoom;
      const pulsePhase = node.pulsePhase || 0;

      ctx.save();

      // ═══════════════════════════════════════════════════════════
      // NODO OBSERVADOR "YO" - VISTA AÉREA CON VOLUMEN
      // ═══════════════════════════════════════════════════════════
      if (node.type === 'observer') {
        // SOMBRA DROP VERTICAL (proyección hacia abajo)
        const shadowOffset = 12;
        const shadowGradient = ctx.createRadialGradient(
          pos.x, 
          pos.y + shadowOffset, 
          radius * 0.3, 
          pos.x, 
          pos.y + shadowOffset, 
          radius * 2
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGradient;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + shadowOffset, radius * 1.2, radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Halo exterior masivo
        const haloRadius = radius * 3.5;
        const haloGradient = ctx.createRadialGradient(pos.x, pos.y, radius, pos.x, pos.y, haloRadius);
        haloGradient.addColorStop(0, 'rgba(168, 85, 247, 0.25)');
        haloGradient.addColorStop(0.4, 'rgba(168, 85, 247, 0.12)');
        haloGradient.addColorStop(0.7, 'rgba(168, 85, 247, 0.05)');
        haloGradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
        
        ctx.fillStyle = haloGradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Doble anillo exterior pulsante
        const ring1Radius = radius + 15 + Math.sin(pulsePhase) * 5;
        const ring2Radius = radius + 25 + Math.sin(pulsePhase + Math.PI) * 5;
        
        // Anillo 1
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.6 + Math.sin(pulsePhase) * 0.3})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#a855f7';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ring1Radius, 0, Math.PI * 2);
        ctx.stroke();

        // Anillo 2
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + Math.sin(pulsePhase + Math.PI) * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ring2Radius, 0, Math.PI * 2);
        ctx.stroke();

        // Anillo de energía rotante
        const energySegments = 8;
        for (let i = 0; i < energySegments; i++) {
          const angle = (i / energySegments) * Math.PI * 2 + (pulsePhase * 0.5);
          const segmentLength = (Math.PI * 2) / energySegments * 0.6;
          
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.7 + Math.sin(angle + pulsePhase) * 0.3})`;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#06b6d4';
          
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 10, angle, angle + segmentLength);
          ctx.stroke();
        }

        // NÚCLEO CON VOLUMEN - Esfera vista desde arriba
        // Degradado vertical con brillo cenital (top-down lighting)
        const coreGradient = ctx.createRadialGradient(
          pos.x - radius * 0.35,  // Luz desde arriba-izquierda
          pos.y - radius * 0.35, 
          0, 
          pos.x, 
          pos.y, 
          radius
        );
        coreGradient.addColorStop(0, '#ffffff');        // Brillo cenital máximo
        coreGradient.addColorStop(0.2, '#f3e8ff');      // Transición suave
        coreGradient.addColorStop(0.4, '#e9d5ff');      
        coreGradient.addColorStop(0.7, '#a855f7');      
        coreGradient.addColorStop(1, '#6b21a8');        // Borde oscuro (sombra)
        
        ctx.fillStyle = coreGradient;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#a855f7';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // BORDE SUPERIOR ILUMINADO (efecto esfera top-down)
        const topLightGradient = ctx.createRadialGradient(
          pos.x - radius * 0.5, 
          pos.y - radius * 0.5, 
          0, 
          pos.x, 
          pos.y, 
          radius * 0.8
        );
        topLightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        topLightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        topLightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = topLightGradient;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Efecto de respiración (overlay)
        const breatheIntensity = (Math.sin(pulsePhase * 0.5) + 1) / 2;
        ctx.globalAlpha = breatheIntensity * 0.25;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Borde brillante con volumen
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.stroke();

      } else {
        // ═══════════════════════════════════════════════════════════
        // OTROS NODOS - VISTA AÉREA CON VOLUMEN Y PROFUNDIDAD
        // ═══════════════════════════════════════════════════════════
        
        // Pulsación sutil
        const vibration = Math.sin(pulsePhase) * (radius * 0.1);
        const currentRadius = radius + vibration;
        
        // SOMBRA DROP VERTICAL (proyección hacia abajo - perpendicular)
        const shadowOffset = 8;
        const shadowGradient = ctx.createRadialGradient(
          pos.x, 
          pos.y + shadowOffset, 
          currentRadius * 0.2, 
          pos.x, 
          pos.y + shadowOffset, 
          currentRadius * 1.8
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = shadowGradient;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + shadowOffset, currentRadius * 1.1, currentRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow exterior con efecto atmosférico
        const glowRadius = currentRadius * 2.5;
        const glowGradient = ctx.createRadialGradient(pos.x, pos.y, currentRadius * 0.5, pos.x, pos.y, glowRadius);
        glowGradient.addColorStop(0, node.color.replace(')', ', 0.5)').replace('rgb', 'rgba'));
        glowGradient.addColorStop(0.5, node.color.replace(')', ', 0.2)').replace('rgb', 'rgba'));
        glowGradient.addColorStop(1, node.color.replace(')', ', 0)').replace('rgb', 'rgba'));
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // NÚCLEO CON VOLUMEN - Esfera vista desde arriba
        // Degradado con brillo cenital (top-down lighting)
        const nodeGradient = ctx.createRadialGradient(
          pos.x - currentRadius * 0.4,  // Luz desde arriba-izquierda
          pos.y - currentRadius * 0.4,
          0,
          pos.x,
          pos.y,
          currentRadius
        );
        nodeGradient.addColorStop(0, '#ffffff');  // Brillo cenital máximo
        nodeGradient.addColorStop(0.25, node.color.replace(')', ', 0.9)').replace('rgb', 'rgba'));
        nodeGradient.addColorStop(0.6, node.color);
        nodeGradient.addColorStop(1, node.color.replace(')', ', 0.6)').replace('rgb', 'rgba')); // Borde más oscuro
        
        ctx.fillStyle = nodeGradient;
        ctx.shadowBlur = 20;
        ctx.shadowColor = node.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // BORDE SUPERIOR ILUMINADO (efecto esfera top-down)
        const topLightGradient = ctx.createRadialGradient(
          pos.x - currentRadius * 0.45, 
          pos.y - currentRadius * 0.45, 
          0, 
          pos.x, 
          pos.y, 
          currentRadius * 0.75
        );
        topLightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        topLightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        topLightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = topLightGradient;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, currentRadius * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Borde brillante con volumen
        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.shadowBlur = isSelected ? 15 : 10;
        ctx.shadowColor = isSelected ? '#ffffff' : node.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Anillo de progreso (si existe)
        if (node.progress !== undefined && node.progress > 0) {
          const progressRadius = currentRadius + 6;
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.8;
          ctx.shadowBlur = 10;
          ctx.shadowColor = node.color;
          
          ctx.beginPath();
          ctx.arc(
            pos.x,
            pos.y,
            progressRadius,
            -Math.PI / 2,
            -Math.PI / 2 + (node.progress / 100) * Math.PI * 2
          );
          ctx.stroke();
          
          // Punto final del progreso
          const endAngle = -Math.PI / 2 + (node.progress / 100) * Math.PI * 2;
          const endX = pos.x + Math.cos(endAngle) * progressRadius;
          const endY = pos.y + Math.sin(endAngle) * progressRadius;
          
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(endX, endY, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Indicador de energía (modo energía)
        if (viewMode === 'energy' && node.energy) {
          const energyRadius = currentRadius * 0.6 * (node.energy / 10);
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#fbbf24';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#fbbf24';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, energyRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Indicador de estado (modo estrategia)
        if (viewMode === 'strategy' && node.status) {
          const statusColor = 
            node.status === 'active' ? '#10b981' :
            node.status === 'paused' ? '#f59e0b' :
            node.status === 'completed' ? '#06b6d4' : '#64748b';
          
          const statusX = pos.x + currentRadius * 0.7;
          const statusY = pos.y - currentRadius * 0.7;
          
          ctx.globalAlpha = 1;
          ctx.fillStyle = statusColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = statusColor;
          ctx.beginPath();
          ctx.arc(statusX, statusY, 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(statusX, statusY, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Label con fondo premium
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      const fontSize = node.type === 'observer' ? Math.max(14, 16 * zoom) : Math.max(10, 11 * zoom);
      ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const metrics = ctx.measureText(node.label);
      const labelWidth = metrics.width + 12;
      const labelHeight = fontSize + 10;
      const labelY = pos.y + radius + 12;
      
      // Fondo del label con borde
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 1;
      const cornerRadius = 4;
      
      ctx.beginPath();
      ctx.roundRect(pos.x - labelWidth / 2, labelY, labelWidth, labelHeight, cornerRadius);
      ctx.fill();
      ctx.stroke();
      
      // Texto del label
      ctx.fillStyle = node.type === 'observer' ? '#ffffff' : '#e2e8f0';
      ctx.shadowBlur = node.type === 'observer' ? 5 : 0;
      ctx.shadowColor = node.type === 'observer' ? node.color : 'transparent';
      ctx.fillText(node.label, pos.x, labelY + 5);

      ctx.restore();
    });
    
    ctx.restore();
  };

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = screenToWorld(x, y, canvas);

    // Check if clicking on a node
    let clickedNode: string | null = null;
    for (const node of nodes) {
      const dx = worldPos.x - node.x;
      const dy = worldPos.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < node.size) {
        clickedNode = node.id;
        break;
      }
    }

    if (clickedNode && clickedNode !== 'observer') {
      setDraggedNode(clickedNode);
      setSelectedNode(clickedNode);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX * zoom, y: e.clientY - panY * zoom });
    }
  }, [nodes, panX, panY, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (draggedNode) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = screenToWorld(x, y, canvas);

      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === draggedNode
            ? { ...node, x: worldPos.x, y: worldPos.y }
            : node
        )
      );
    } else if (isDragging) {
      const newPanX = (e.clientX - dragStart.x) / zoom;
      const newPanY = (e.clientY - dragStart.y) / zoom;
      setPanX(newPanX);
      setPanY(newPanY);
    }
  }, [draggedNode, isDragging, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDraggedNode(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prevZoom => Math.max(0.3, Math.min(3, prevZoom * delta)));
  }, []);

  const resetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setSelectedNode(null);
  };

  if (nodes.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 border-purple-500/40 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <Eye className="h-10 w-10 text-purple-400 animate-pulse" />
            Leviathan 4D Vision
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-4 border-purple-500/30 rounded-full animate-ping"></div>
              </div>
              <div className="relative text-lg font-medium text-purple-300 animate-pulse">
                Inicializando vista holográfica...
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 border-purple-500/40 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
            <Eye className="h-10 w-10 text-purple-400" />
            Leviathan 4D Vision
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={processData}
              className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between flex-wrap gap-4 mt-4">
          {/* Modos Cuánticos de Visualización */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={viewMode === 'energy' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('energy')}
              className={viewMode === 'energy' 
                ? 'bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/50' 
                : 'text-slate-400 hover:text-orange-300 hover:bg-orange-500/10'
              }
            >
              <Zap className="h-4 w-4 mr-1" />
              Energía
            </Button>
            <Button
              variant={viewMode === 'strategy' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('strategy')}
              className={viewMode === 'strategy' 
                ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/50' 
                : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10'
              }
            >
              <Target className="h-4 w-4 mr-1" />
              Estrategia
            </Button>
            <Button
              variant={viewMode === 'relational' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('relational')}
              className={viewMode === 'relational' 
                ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 text-white shadow-lg shadow-pink-500/50' 
                : 'text-slate-400 hover:text-pink-300 hover:bg-pink-500/10'
              }
            >
              <Users className="h-4 w-4 mr-1" />
              Relacional
            </Button>
            <Button
              variant={viewMode === 'manifestations' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('manifestations')}
              className={viewMode === 'manifestations' 
                ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-lg shadow-green-500/50' 
                : 'text-slate-400 hover:text-green-300 hover:bg-green-500/10'
              }
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Manifestaciones
            </Button>
            <Button
              variant={viewMode === 'futures' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('futures')}
              className={viewMode === 'futures' 
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/50' 
                : 'text-slate-400 hover:text-purple-300 hover:bg-purple-500/10'
              }
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              Futuros
            </Button>
          </div>

          {/* Controles Cuánticos */}
          <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-1 border border-purple-500/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.max(0.3, z * 0.8))}
              className="text-slate-400 hover:text-slate-200 h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-mono text-purple-300 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.min(3, z * 1.25))}
              className="text-slate-400 hover:text-slate-200 h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-purple-500/30 mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetView}
              className="text-slate-400 hover:text-slate-200 h-8 w-8 p-0"
              title="Resetear vista"
            >
              <Move className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 text-sm">
          <Activity className="h-4 w-4 text-purple-400" />
          <p className="text-slate-400">
            <span className="text-purple-300 font-medium">Vista Aérea Holográfica</span> • 
            Arrastra para mover • Scroll para zoom • {nodes.length} {nodes.length === 1 ? 'nodo real' : 'nodos reales'}
          </p>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-[600px] rounded-xl border-2 border-purple-500/30 cursor-move shadow-2xl shadow-purple-900/50"
            style={{ touchAction: 'none' }}
          />
          
          {/* Overlay de información */}
          <div className="absolute top-4 left-4 bg-slate-900/90 border border-purple-500/30 rounded-lg px-4 py-2 backdrop-blur-sm">
            <div className="text-xs font-mono text-purple-300">
              Modo: <span className="text-white font-bold">{
                viewMode === 'energy' ? 'ENERGÍA' :
                viewMode === 'strategy' ? 'ESTRATEGIA' :
                viewMode === 'relational' ? 'RELACIONAL' :
                viewMode === 'manifestations' ? 'MANIFESTACIONES' :
                'FUTUROS POTENCIALES'
              }</span>
            </div>
          </div>
        </div>

        {/* Leyenda Premium */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50"></div>
            <span className="text-sm text-purple-200 font-medium">Observador</span>
          </div>
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"></div>
            <span className="text-sm text-cyan-200 font-medium">Proyectos</span>
          </div>
          <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"></div>
            <span className="text-sm text-orange-200 font-medium">Relaciones</span>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
            <span className="text-sm text-green-200 font-medium">Manifestaciones</span>
          </div>
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
            <span className="text-sm text-yellow-200 font-medium">Energía</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
