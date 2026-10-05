
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import { Node3D } from './Node3D';
import { Link3D } from './Link3D';
import { Grid3D } from './Grid3D';
import { Particles3D } from './Particles3D';
import { Card } from '@/components/ui/card';
import { X, Filter, Layers, Target, Sparkles, Users, Briefcase, Lightbulb, Loader2, AlertCircle, TrendingUp, TrendingDown, Zap, ArrowRight, Brain, DollarSign, Orbit, Activity, Search, Maximize2, Network, Play, BarChart3 } from 'lucide-react';
import { interpretNode, NodeInterpretation } from '@/lib/nodeInterpreter';

// Modos de visualización
type ViewMode = 'coherence' | 'economy';
type ProjectionMode = '3d' | '2d';

interface NodeData {
  id: string;
  x: number;
  y: number;
  z: number;
  size: number;
  energy: number;
  coherence?: number;
  label: string;
  color: string;
  type: string;
  metadata?: Record<string, any>;
}

interface LinkData {
  source: string;
  target: string;
  strength: number;
}

interface APIResponse {
  success: boolean;
  nodes: NodeData[];
  links: LinkData[];
  stats: {
    total: number;
    avgEnergy: number;
    connections: number;
    breakdown?: {
      projects: number;
      relationships: number;
      intentions: number;
      manifestations: number;
    };
    coherence?: {
      overall: number;
      emotional: number;
      logical: number;
      energetic: number;
    };
    signals?: {
      projects: number;
      relationships: number;
      dailyEntries: number;
      sufficient: boolean;
    };
  };
}

const NODE_TYPES = [
  { id: 'all', label: 'Todos', icon: Layers, color: '#ffffff' },
  { id: 'self', label: 'Observador', icon: Target, color: '#67e8f9' },
  { id: 'project', label: 'Proyectos', icon: Briefcase, color: '#8b5cf6' },
  { id: 'relationship', label: 'Relaciones', icon: Users, color: '#6ee7b7' },
  { id: 'intention', label: 'Intenciones', icon: Lightbulb, color: '#00ff88' },
  { id: 'manifestation', label: 'Manifestaciones', icon: Sparkles, color: '#ff0088' },
];

// Datos de ejemplo cuando no hay datos o no está autenticado
const EXAMPLE_NODES: NodeData[] = [
  { id: 'observer', x: 0, y: 0, z: 54, size: 3.5, energy: 1.0, label: 'Observador 4D', color: '#00ffff', type: 'self' },
  { id: 'work', x: 25, y: -15, z: 36, size: 2.4, energy: 0.85, label: 'Proyecto Principal', color: '#ff00ff', type: 'project' },
  { id: 'business', x: -20, y: 25, z: 24, size: 2.0, energy: 0.72, label: 'Emprendimiento', color: '#ff44aa', type: 'project' },
  { id: 'creativity', x: 30, y: 20, z: 15, size: 1.8, energy: 0.65, label: 'Creatividad', color: '#ff0088', type: 'project' },
  { id: 'family', x: -25, y: -20, z: 42, size: 2.6, energy: 0.92, label: 'Familia', color: '#ffaa00', type: 'relationship' },
  { id: 'partner', x: -15, y: -30, z: 48, size: 2.8, energy: 0.95, label: 'Pareja', color: '#ff6600', type: 'relationship' },
  { id: 'friends', x: 15, y: -25, z: 27, size: 2.0, energy: 0.78, label: 'Amistades', color: '#ffcc00', type: 'relationship' },
  { id: 'health', x: -30, y: 10, z: 18, size: 2.0, energy: 0.70, label: 'Salud Óptima', color: '#00ff88', type: 'intention' },
  { id: 'learning', x: 20, y: 30, z: 30, size: 1.9, energy: 0.75, label: 'Aprendizaje', color: '#44ff88', type: 'intention' },
  { id: 'peace', x: -10, y: 35, z: 33, size: 2.2, energy: 0.82, label: 'Paz Interior', color: '#00ffaa', type: 'intention' },
  { id: 'abundance', x: 35, y: 5, z: 21, size: 2.1, energy: 0.68, label: 'Abundancia', color: '#ff0088', type: 'manifestation' },
  { id: 'purpose', x: -5, y: -35, z: 39, size: 2.3, energy: 0.88, label: 'Propósito de Vida', color: '#ff44cc', type: 'manifestation' },
];


const EMPTY_NODES: NodeData[] = [
  { id: 'observer', x: 0, y: 0, z: 45, size: 3.5, energy: 0, label: 'Observador 4D', color: '#00ffff', type: 'self', metadata: { empty: true, coherence: 0 } },
];

const EMPTY_BREAKDOWN: NonNullable<APIResponse['stats']['breakdown']> = { projects: 0, relationships: 0, intentions: 0, manifestations: 0 };
const EMPTY_STATS: APIResponse['stats'] = { total: 1, avgEnergy: 0, connections: 0, breakdown: EMPTY_BREAKDOWN, signals: { projects: 0, relationships: 0, dailyEntries: 0, sufficient: false } };

const VISUAL_REFERENCE_NODES: NodeData[] = [
  { id: 'observer', x: 12, y: -1, z: 22, size: 5.3, energy: 0.9, coherence: 0.9, label: 'Tú / Observador', color: '#67e8f9', type: 'self', metadata: { source: 'Escenario visual de prueba', empty: true } },
  { id: 'project_levi', x: -14, y: -8, z: 29, size: 4.2, energy: 0.5, coherence: 0.7, label: 'levi / Proyecto', color: '#8b5cf6', type: 'project', metadata: { description: 'chasis', progress: 0, energyInvested: 5, impactLevel: 7, source: 'Escenario visual de prueba' } },
  { id: 'relationship_diego', x: -7, y: 15, z: 17, size: 3.35, energy: 0.65, coherence: 0.65, label: 'diego / Relación', color: '#6ee7b7', type: 'relationship', metadata: { source: 'Escenario visual de prueba' } },
];

const VISUAL_REFERENCE_LINKS: LinkData[] = [
  { source: 'observer', target: 'project_levi', strength: 0.72 },
  { source: 'observer', target: 'relationship_diego', strength: 0.62 },
];

const VISUAL_REFERENCE_STATS: APIResponse['stats'] = {
  total: 3,
  avgEnergy: 0.68,
  connections: 2,
  breakdown: { projects: 1, relationships: 1, intentions: 0, manifestations: 0 },
  signals: { projects: 1, relationships: 1, dailyEntries: 1, sufficient: true },
};

const EXAMPLE_LINKS: LinkData[] = [
  { source: 'observer', target: 'work', strength: 0.9 },
  { source: 'observer', target: 'family', strength: 0.95 },
  { source: 'observer', target: 'partner', strength: 0.98 },
  { source: 'observer', target: 'health', strength: 0.8 },
  { source: 'observer', target: 'peace', strength: 0.85 },
  { source: 'observer', target: 'purpose', strength: 0.92 },
  { source: 'work', target: 'creativity', strength: 0.7 },
  { source: 'work', target: 'business', strength: 0.75 },
  { source: 'business', target: 'abundance', strength: 0.65 },
  { source: 'family', target: 'partner', strength: 0.88 },
  { source: 'family', target: 'friends', strength: 0.6 },
  { source: 'health', target: 'peace', strength: 0.72 },
  { source: 'learning', target: 'creativity', strength: 0.68 },
  { source: 'purpose', target: 'abundance', strength: 0.58 },
  { source: 'peace', target: 'purpose', strength: 0.78 },
];

function Scene3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const nodeMeshesRef = useRef<Map<string, BABYLON.Mesh>>(new Map());
  const linkMeshesRef = useRef<Array<{ mesh: BABYLON.Mesh; source: string; target: string }>>([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectionMode, setProjectionMode] = useState<ProjectionMode>('3d');
  const [nodesData, setNodesData] = useState<NodeData[]>([]);
  const [linksData, setLinksData] = useState<LinkData[]>([]);
  const [stats, setStats] = useState<APIResponse['stats']>({ total: 0, avgEnergy: 0, connections: 0, signals: { projects: 0, relationships: 0, dailyEntries: 0, sufficient: false } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingRealData, setUsingRealData] = useState(false);
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [timelineSnapshots, setTimelineSnapshots] = useState<Array<{ id: string; nodeLabel: string; createdAt: string }>>([]);
  const [selectedSnapshotIds, setSelectedSnapshotIds] = useState<string[]>([]);
  const visualReferenceMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('visual') === 'reference';
  
  // Modo de visualización: coherencia (nodos normales) o economía (sistema solar)
  const [viewMode, setViewMode] = useState<ViewMode>('coherence');
  const [economyData, setEconomyData] = useState<{
    projects: Array<{
      id: string;
      name: string;
      totalRevenue: number;
      transactionsPerHour: number;
      agentMode: string;
    }>;
    globalMetrics: {
      totalBalance: number;
      monthlyRevenue: number;
      decisionsToday: number;
    };
  } | null>(null);
  
  // Estado para análisis IA
  const [aiAnalysis, setAiAnalysis] = useState<{
    loading: boolean;
    result: { coherence: number; energy: number; diagnosis: string; recommendation: string } | null;
    error: string | null;
  }>({ loading: false, result: null, error: null });
  const [systemCoherence, setSystemCoherence] = useState<number>(0);

  // Función para análisis IA del nodo seleccionado
  const analyzeNodeWithAI = useCallback(async (node: NodeData) => {
    setAiAnalysis({ loading: true, result: null, error: null });
    try {
      const response = await fetch('/api/gemini/analyze-coherence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLog: `Analiza el estado de "${node.label}" (${node.type}). Energía actual: ${(node.energy * 100).toFixed(0)}%. Conexiones con otros elementos del sistema.`,
          projectName: node.label,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en análisis IA');
      }

      const result = await response.json();
      setAiAnalysis({ loading: false, result, error: null });
    } catch (err) {
      setAiAnalysis({ 
        loading: false, 
        result: null, 
        error: (err as Error).message || 'Error al analizar con IA'
      });
    }
  }, []);

  // Limpiar análisis IA cuando cambia el nodo seleccionado
  useEffect(() => {
    setAiAnalysis({ loading: false, result: null, error: null });
  }, [selectedNode]);

  // Motor de Significado: Interpretación del nodo seleccionado
  const nodeInterpretation = useMemo<NodeInterpretation | null>(() => {
    if (!selectedNode || nodesData.length === 0) return null;
    return interpretNode(
      { ...selectedNode, coherence: selectedNode.coherence ?? selectedNode.metadata?.coherence },
      linksData,
      systemCoherence
    );
  }, [selectedNode, linksData, nodesData, systemCoherence]);


  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleNodes = useMemo(() => {
    return nodesData.filter((node) => {
      const matchesFilter = activeFilter === 'all' || node.type === activeFilter;
      const matchesSearch = !normalizedSearch || node.label.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [nodesData, activeFilter, normalizedSearch]);

  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];
    return nodesData
      .filter((node) => node.label.toLowerCase().includes(normalizedSearch))
      .slice(0, 6);
  }, [nodesData, normalizedSearch]);

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];
    return linksData
      .filter((link) => link.source === selectedNode.id || link.target === selectedNode.id)
      .map((link) => {
        const otherId = link.source === selectedNode.id ? link.target : link.source;
        return {
          ...link,
          otherNode: nodesData.find((node) => node.id === otherId),
        };
      })
      .filter((link) => Boolean(link.otherNode));
  }, [selectedNode, linksData, nodesData]);

  const selectedLastChange = useMemo(() => {
    const metadata = selectedNode?.metadata;
    if (!metadata) return null;
    const rawDate = metadata.updatedAt || metadata.lastUpdated || metadata.createdAt || metadata.date;
    if (!rawDate || typeof rawDate !== 'string') return null;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return null;
    return `${date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  }, [selectedNode]);


  const hasSufficientEvidence = Boolean(stats.signals?.sufficient);
  const missingEvidence = useMemo(() => {
    const missing: string[] = [];
    if (!stats.signals?.projects) missing.push('proyecto');
    if (!stats.signals?.relationships) missing.push('relación');
    if (!stats.signals?.dailyEntries) missing.push('registro diario');
    return missing;
  }, [stats.signals]);

  const formatSnapshotDate = useCallback((value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return `${date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
  }, [visualReferenceMode]);


  const toggleSnapshotSelection = useCallback((snapshotId: string) => {
    setSelectedSnapshotIds((current) => {
      if (current.includes(snapshotId)) {
        return current.filter((id) => id !== snapshotId);
      }
      return [...current.slice(-1), snapshotId];
    });
  }, []);

  const canCompareSnapshots = selectedSnapshotIds.length === 2;
  const timelineHelpText = timelineSnapshots.length < 2
    ? 'Necesitas al menos dos capturas reales para comparar.'
    : canCompareSnapshots
      ? 'Listo para comparar las dos capturas seleccionadas.'
      : 'Selecciona dos capturas en la línea temporal.';

  const selectedSourceEnergy = selectedNode ? Math.round((selectedNode.energy || 0) * 100) : 0;
  const selectedSourceCoherence = useMemo(() => {
    if (!selectedNode) return 0;
    const raw = selectedNode.coherence ?? selectedNode.metadata?.coherence ?? 0;
    const numeric = typeof raw === 'number' ? raw : Number(raw);
    if (Number.isNaN(numeric)) return 0;
    return Math.round(numeric <= 1 ? numeric * 100 : numeric);
  }, [selectedNode]);

  // Calcular centro de los nodos para centrar la cámara
  const calculateCenter = useCallback((nodes: NodeData[]) => {
    if (nodes.length === 0) return new BABYLON.Vector3(0, 18, 0);
    const sumX = nodes.reduce((acc, n) => acc + n.x, 0) / nodes.length;
    const sumY = nodes.reduce((acc, n) => acc + n.y, 0) / nodes.length;
    const sumZ = nodes.reduce((acc, n) => acc + n.z, 0) / nodes.length;
    return new BABYLON.Vector3(sumX, projectionMode === '2d' ? 0 : sumZ - 5, sumY);
  }, [projectionMode]);


  const calculateRadius = useCallback((nodes: NodeData[]) => {
    if (nodes.length <= 1) return projectionMode === '2d' ? 58 : 68;
    const center = calculateCenter(nodes);
    const farthest = nodes.reduce((maxDistance, node) => {
      const position = new BABYLON.Vector3(node.x, projectionMode === '2d' ? 0 : node.z, node.y);
      return Math.max(maxDistance, BABYLON.Vector3.Distance(center, position));
    }, 0);
    return Math.max(projectionMode === '2d' ? 82 : 106, Math.min(190, farthest * 2.35 + 60));
  }, [calculateCenter, projectionMode]);

  const frameNodes = useCallback((nodes: NodeData[] = visibleNodes.length > 0 ? visibleNodes : nodesData) => {
    const camera = cameraRef.current;
    if (!camera || nodes.length === 0) return;

    camera.alpha = Math.PI / 4;
    camera.beta = projectionMode === '2d' ? 0.28 : Math.PI / 3.05;
    camera.radius = calculateRadius(nodes);
    camera.target = calculateCenter(nodes);
  }, [calculateCenter, calculateRadius, nodesData, projectionMode, visibleNodes]);

  const focusNode = useCallback((node: NodeData) => {
    setSelectedNode(node);
    const camera = cameraRef.current;
    if (!camera) return;

    const yPosition = projectionMode === '2d' ? 0 : node.z;
    camera.alpha = Math.PI / 4;
    camera.beta = projectionMode === '2d' ? 0.28 : Math.PI / 3.05;
    camera.radius = Math.max(projectionMode === '2d' ? 64 : 58, Math.min(100, 54 + nodesData.length * 4));
    camera.target = new BABYLON.Vector3(node.x, yPosition, node.y);
  }, [nodesData.length, projectionMode]);

  // Cargar datos desde la API
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (visualReferenceMode) {
        setNodesData(VISUAL_REFERENCE_NODES);
        setLinksData(VISUAL_REFERENCE_LINKS);
        setStats(VISUAL_REFERENCE_STATS);
        setBreakdown(VISUAL_REFERENCE_STATS.breakdown ?? EMPTY_BREAKDOWN);
        setSystemCoherence(0.78);
        setUsingRealData(false);
        setSelectedNode(VISUAL_REFERENCE_NODES[1]);
        return;
      }

      const response = await fetch('/api/tablero-3d');
      
      if (!response.ok) {
        if (response.status === 401) {
          setNodesData(EMPTY_NODES);
          setLinksData([]);
          setStats(EMPTY_STATS);
          setBreakdown(EMPTY_BREAKDOWN);
          setSystemCoherence(0);
          setUsingRealData(false);
          return;
        }
        throw new Error('Error al cargar datos');
      }

      const data: APIResponse = await response.json();
      
      if (data.success && data.nodes.length > 0) {
        setNodesData(data.nodes);
        setLinksData(data.links);
        setStats(data.stats);
        setUsingRealData(true);
        if (data.stats.breakdown) {
          setBreakdown(data.stats.breakdown ?? EMPTY_BREAKDOWN);
        }
        if (data.stats.coherence?.overall) {
          setSystemCoherence(data.stats.coherence.overall / 100);
        }
      } else {
        setNodesData(EMPTY_NODES);
        setLinksData([]);
        setStats(EMPTY_STATS);
        setBreakdown(EMPTY_BREAKDOWN);
        setSystemCoherence(0);
        setUsingRealData(false);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setNodesData(EMPTY_NODES);
      setLinksData([]);
      setStats(EMPTY_STATS);
      setBreakdown(EMPTY_BREAKDOWN);
      setSystemCoherence(0);
      setUsingRealData(false);
      setError('No se pudieron cargar datos reales');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, [loadData]);


  useEffect(() => {
    let cancelled = false;
    const loadTimelineSnapshots = async () => {
      try {
        const response = await fetch('/api/timeline/snapshots?days=365&limit=8');
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setTimelineSnapshots((data.snapshots || []).slice(-4));
        }
      } catch (error) {
        console.error('Error cargando capturas del mapa:', error);
      }
    };

    loadTimelineSnapshots();
    return () => {
      cancelled = true;
    };
  }, []);

  // Cargar datos de economía cuando se cambia al modo economía
  const loadEconomyData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/live-economy');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEconomyData({
            projects: data.projects || [],
            globalMetrics: data.global || { totalBalance: 0, monthlyRevenue: 0, decisionsToday: 0 }
          });
        }
      }
    } catch (error) {
      console.error('Error cargando datos de economía:', error);
    }
  }, []);

  useEffect(() => {
    if (viewMode === 'economy') {
      loadEconomyData();
      // Polling cada 10 segundos en modo economía
      const interval = setInterval(loadEconomyData, 10000);
      return () => clearInterval(interval);
    }
  }, [viewMode, loadEconomyData]);

  // Listen for zoom events from parent
  useEffect(() => {
    const handleZoomEvent = (event: CustomEvent<{ action: string }>) => {
      const camera = cameraRef.current;
      if (!camera) return;

      switch (event.detail.action) {
        case 'in':
          camera.radius = Math.max(camera.lowerRadiusLimit || 30, camera.radius - 15);
          break;
        case 'out':
          camera.radius = Math.min(camera.upperRadiusLimit || 250, camera.radius + 15);
          break;
        case 'reset':
          camera.alpha = Math.PI / 4;
          camera.beta = projectionMode === '2d' ? 0.28 : Math.PI / 3.05;
          frameNodes();
          break;
      }
    };

    window.addEventListener('scene3d-zoom', handleZoomEvent as EventListener);
    return () => {
      window.removeEventListener('scene3d-zoom', handleZoomEvent as EventListener);
    };
  }, [nodesData, calculateCenter, frameNodes, projectionMode]);

  // Filtrar nodos y vínculos por visibilidad
  useEffect(() => {
    nodeMeshesRef.current.forEach((mesh, nodeId) => {
      const isVisible = visibleNodeIds.has(nodeId);
      mesh.setEnabled(isVisible);
    });

    linkMeshesRef.current.forEach(({ mesh, source, target }) => {
      mesh.setEnabled(visibleNodeIds.has(source) && visibleNodeIds.has(target));
    });
  }, [visibleNodeIds]);

  useEffect(() => {
    if (!canvasRef.current || loading || nodesData.length === 0) return;

    // Si ya hay una escena, limpiarla
    if (engineRef.current) {
      engineRef.current.dispose();
    }

    // Crear engine
    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    }, true);
    engine.setHardwareScalingLevel(Math.min(1, 1 / (window.devicePixelRatio || 1)));
    engineRef.current = engine;

    // Crear escena
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.006, 0.012, 0.035, 1);
    sceneRef.current = scene;

    // Cámara con vista isométrica más abierta y centrada
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3.05,
      170,
      new BABYLON.Vector3(0, 20, 0),
      scene
    );
    camera.lowerRadiusLimit = 30;
    camera.upperRadiusLimit = 250;
    camera.lowerBetaLimit = 0.2;
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.fov = 0.52;
    camera.attachControl(canvasRef.current, true);
    camera.wheelPrecision = 15;
    camera.panningSensibility = 30;
    camera.inertia = 0.7;
    cameraRef.current = camera;

    // Luz cenital suave
    const light1 = new BABYLON.HemisphericLight(
      'topLight',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light1.intensity = 0.48;
    light1.diffuse = new BABYLON.Color3(0.9, 0.95, 1);
    light1.groundColor = new BABYLON.Color3(0.1, 0.1, 0.2);

    // Luz direccional para sombras
    const light2 = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(0.5, -1, 0.3),
      scene
    );
    light2.intensity = 0.68;
    light2.position = new BABYLON.Vector3(30, 80, 30);

    // Shadow generator
    const shadowGenerator = new BABYLON.ShadowGenerator(2048, light2);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 64;
    shadowGenerator.darkness = 0.4;

    // Crear grid 3D holográfico
    Grid3D.create(scene);

    // Usar datos del estado (ya cargados desde API o ejemplo)
    const heightMultiplier = projectionMode === '2d' ? 0 : (debugMode ? 1.5 : 1);
    const nodes = nodesData.map(node => ({
      ...node,
      z: node.z * heightMultiplier,
    }));

    const links = linksData;
    linkMeshesRef.current = [];

    // Crear nodos 3D y guardarlos en el ref
    const nodeMeshes = new Map<string, BABYLON.Mesh>();
    nodes.forEach((nodeData) => {
      const mesh = Node3D.create(scene, nodeData, shadowGenerator);
      nodeMeshes.set(nodeData.id, mesh);

      // Interacción con nodos
      mesh.actionManager = new BABYLON.ActionManager(scene);
      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
          focusNode(nodeData);
        })
      );

      // Hover effect
      mesh.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
          scene.hoverCursor = 'pointer';
        })
      );
    });
    nodeMeshesRef.current = nodeMeshes;

    // Crear links 3D
    links.forEach((linkData) => {
      const sourceNode = nodes.find((n) => n.id === linkData.source);
      const targetNode = nodes.find((n) => n.id === linkData.target);
      if (sourceNode && targetNode) {
        const linkMesh = Link3D.create(scene, sourceNode, targetNode, linkData);
        linkMeshesRef.current.push({ mesh: linkMesh, source: linkData.source, target: linkData.target });
      }
    });

    // Centrar cámara en el centro de los nodos después de crearlos
    const center = calculateCenter(nodes);
    camera.target = center;
    camera.radius = calculateRadius(nodes);
    camera.beta = projectionMode === '2d' ? 0.28 : Math.PI / 3.05;

    // Crear sistema de partículas
    Particles3D.create(scene);

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, [debugMode, nodesData, linksData, loading, projectionMode, calculateCenter, calculateRadius, focusNode]); // Recrear escena cuando cambien los datos

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto" />
          <p className="text-cyan-400 font-light text-lg">Cargando tu mapa dimensional...</p>
          <p className="text-slate-400 text-sm">Sincronizando datos del observador</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="h-full w-full outline-none"
        style={{ touchAction: 'none' }}
      />

      {/* Encabezado estilo constelación */}
      <div className="pointer-events-none absolute left-7 right-7 top-7 z-50 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight text-white drop-shadow-[0_0_22px_rgba(125,211,252,0.25)]">
            Tu mapa, conectado
          </h1>
          <p className="mt-1 text-[18px] text-blue-200/85">
            {stats.total} {stats.total === 1 ? 'nodo' : 'nodos'} · {stats.connections} {stats.connections === 1 ? 'vínculo' : 'vínculos'}
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-3">
          <div className="relative w-[300px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-200/70" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar en tu mapa..."
              className="h-12 w-full rounded-2xl border border-blue-200/20 bg-slate-950/45 pl-12 pr-10 text-sm text-white shadow-xl shadow-blue-950/20 outline-none backdrop-blur-xl placeholder:text-blue-200/55 focus:border-cyan-300/60"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-blue-200/60 hover:bg-white/10 hover:text-white"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {(searchResults.length > 0 || (normalizedSearch && searchResults.length === 0)) && (
              <div className="absolute mt-3 w-full overflow-hidden rounded-2xl border border-blue-200/15 bg-slate-950/90 p-2 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
                {searchResults.length > 0 ? (
                  searchResults.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => focusNode(node)}
                      className="w-full rounded-xl px-3 py-2 text-left hover:bg-cyan-400/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-white">{node.label}</span>
                        <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-blue-200/55">
                          {NODE_TYPES.find(t => t.id === node.type)?.label || node.type}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-blue-200/60">No encontré nodos con ese nombre.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex h-12 items-center gap-1 rounded-2xl border border-blue-200/20 bg-slate-950/45 p-1 shadow-xl shadow-blue-950/20 backdrop-blur-xl">
            <button
              onClick={() => setProjectionMode('2d')}
              className={`h-10 rounded-xl px-5 text-sm font-semibold transition-all ${projectionMode === '2d' ? 'bg-cyan-400/20 text-cyan-100 shadow-inner shadow-cyan-300/20' : 'text-blue-200/75 hover:text-white'}`}
            >
              2D
            </button>
            <button
              onClick={() => setProjectionMode('3d')}
              className={`h-10 rounded-xl px-5 text-sm font-semibold transition-all ${projectionMode === '3d' ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/35' : 'text-blue-200/75 hover:text-white'}`}
            >
              3D
            </button>
          </div>

          <div className="rounded-full border border-cyan-200/25 bg-slate-950/35 px-4 py-1.5 text-xs font-medium text-cyan-100 shadow-xl shadow-cyan-950/20 backdrop-blur-xl">
            Concepto visual
          </div>
        </div>
      </div>

      {/* Overlay de Economía cuando está en modo economy */}
      {viewMode === 'economy' && economyData && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {/* Métricas flotantes arriba a la derecha */}
          <div className="absolute top-40 right-6 space-y-3 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4 w-48">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-xs text-slate-400">Balance Total</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                ${economyData.globalMetrics.totalBalance.toLocaleString()}
              </p>
            </div>
            <div className="bg-black/80 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4 w-48">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-slate-400">Este Mes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                ${economyData.globalMetrics.monthlyRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-black/80 backdrop-blur-md border border-yellow-500/30 rounded-lg p-4 w-48">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-cyan-400" />
                <span className="text-xs text-slate-400">Decisiones Hoy</span>
              </div>
              <p className="text-2xl font-bold text-cyan-400">
                {economyData.globalMetrics.decisionsToday}
              </p>
            </div>
          </div>

          {/* Lista de proyectos orbitando */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-md border border-slate-600/50 rounded-lg p-3 flex items-center gap-3">
              <Orbit className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-slate-400">Proyectos Orbitando:</span>
              {economyData.projects.length === 0 ? (
                <span className="text-xs text-slate-500">Ningún proyecto registrado</span>
              ) : (
                economyData.projects.map((project) => (
                  <div 
                    key={project.id}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
                      project.agentMode === 'paused' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {project.name}
                    <span className="text-yellow-400">${project.totalRevenue}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Link a Economy View completa */}
          <div className="absolute top-40 left-6 pointer-events-auto">
            <a
              href="/economy-view"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm font-medium transition-all"
            >
              <Orbit className="h-4 w-4" />
              Ver Sistema Solar Completo
            </a>
          </div>
        </div>
      )}

      {/* Controles inferiores y memoria del mapa */}
      <div className="pointer-events-none absolute bottom-7 left-7 right-7 z-50 space-y-5 2xl:right-[388px]">
        <div className="pointer-events-auto flex flex-wrap items-center gap-3">
          <button
            onClick={() => frameNodes()}
            className="flex h-12 items-center gap-3 rounded-2xl border border-blue-200/20 bg-slate-950/55 px-5 text-sm font-medium text-white shadow-xl shadow-blue-950/25 backdrop-blur-xl hover:border-cyan-300/50 hover:bg-cyan-400/10"
          >
            <Maximize2 className="h-4 w-4 text-blue-100" />
            Centrar mapa
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex h-12 items-center gap-3 rounded-2xl border px-5 text-sm font-medium shadow-xl shadow-blue-950/25 backdrop-blur-xl transition-all ${showFilters ? 'border-violet-300/50 bg-violet-500/25 text-white' : 'border-blue-200/20 bg-slate-950/55 text-blue-100 hover:border-violet-300/50 hover:bg-violet-400/10'}`}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          <div className="flex h-12 items-center gap-3 rounded-2xl border border-blue-200/20 bg-slate-950/55 px-5 text-sm text-blue-100 shadow-xl shadow-blue-950/25 backdrop-blur-xl">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />Tú</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />Proyecto</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />Relación</span>
          </div>

          <button
            onClick={() => setDebugMode(!debugMode)}
            className="flex h-12 items-center gap-3 rounded-2xl border border-blue-200/20 bg-slate-950/55 px-5 text-sm font-medium text-blue-100 shadow-xl shadow-blue-950/25 backdrop-blur-xl hover:border-cyan-300/50 hover:bg-cyan-400/10"
          >
            <Network className="h-4 w-4" />
            {debugMode ? 'Reducir alturas' : 'Resaltar alturas'}
          </button>
        </div>

        {showFilters && (
          <Card className="pointer-events-auto w-80 border-blue-200/20 bg-slate-950/85 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200/70">Tipos de elemento</p>
            <div className="grid grid-cols-2 gap-2">
              {NODE_TYPES.map((type) => {
                const Icon = type.icon;
                const isActive = activeFilter === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveFilter(type.id)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${isActive ? 'border-cyan-300/50 bg-cyan-400/15 text-white' : 'border-blue-200/10 bg-white/[0.03] text-blue-100/75 hover:bg-white/[0.07]'}`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: type.color }} />
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        <Card className="pointer-events-auto border-blue-200/20 bg-slate-950/55 p-4 shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 lg:grid-cols-[auto_minmax(180px,240px)_auto] 2xl:grid-cols-[auto_240px_minmax(260px,1fr)_auto]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200/20 bg-blue-400/10">
              <Layers className="h-6 w-6 text-blue-100" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">Memoria del mapa</p>
              <p className="text-xs text-blue-200/70">{timelineHelpText}</p>
            </div>
            <div className="hidden min-w-0 items-center gap-0 2xl:flex">
              {timelineSnapshots.length === 0 ? (
                <div className="flex w-full items-center justify-center rounded-2xl border border-blue-200/15 bg-slate-950/35 px-4 py-3 text-sm text-blue-200/60">
                  Sin capturas reales todavía
                </div>
              ) : (
                timelineSnapshots.map((snapshot, index) => {
                  const selected = selectedSnapshotIds.includes(snapshot.id);
                  const latest = index === timelineSnapshots.length - 1;
                  return (
                    <div key={snapshot.id} className="flex min-w-0 flex-1 items-center">
                      <button
                        onClick={() => toggleSnapshotSelection(snapshot.id)}
                        className="group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-2xl px-2 py-1.5 transition hover:bg-cyan-400/10"
                        title={`Captura ${formatSnapshotDate(snapshot.createdAt)}`}
                      >
                        <span className={`h-4 w-4 rounded-full border transition ${selected ? 'border-cyan-200 bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]' : latest ? 'border-violet-300 bg-violet-400 shadow-[0_0_16px_rgba(167,139,250,0.9)]' : 'border-blue-200/70 bg-slate-950'}`} />
                        <span className={`max-w-[9rem] truncate text-center text-[11px] leading-tight ${selected ? 'text-cyan-100' : 'text-blue-200/65'}`}>
                          {formatSnapshotDate(snapshot.createdAt)}
                        </span>
                      </button>
                      {index < timelineSnapshots.length - 1 && <div className="h-px w-8 shrink-0 bg-blue-200/25" />}
                    </div>
                  );
                })
              )}
            </div>
            <div className="col-span-2 flex min-w-0 items-center gap-3 lg:col-span-1 lg:justify-end">
              <button disabled={timelineSnapshots.length < 2} title={timelineSnapshots.length < 2 ? 'Necesitas al menos dos capturas reales para reproducir la evolución.' : 'Reproducir evolución'} className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200/30 bg-slate-950/50 text-blue-100 hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:text-slate-500 disabled:hover:bg-slate-950/50" aria-label="Reproducir evolución">
                <Play className="h-4 w-4 fill-current" />
              </button>
              <button disabled={!canCompareSnapshots} title={timelineHelpText} className="flex h-12 items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none">
                <BarChart3 className="h-4 w-4" />
                {canCompareSnapshots ? 'Comparar capturas' : 'Selecciona 2'}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Panel de información del nodo seleccionado */}
      {selectedNode && (
        <div className="absolute right-6 top-[118px] z-40 w-[370px] max-h-[calc(100vh-9rem)] animate-in slide-in-from-right overflow-y-auto pr-1">
          <Card className="overflow-hidden border-blue-200/20 bg-slate-950/72 shadow-2xl shadow-blue-950/40 backdrop-blur-2xl">
            <div className="p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className={`flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-2xl border shadow-2xl ${selectedNode.type === 'project' ? 'border-violet-300/30 bg-violet-500/15 shadow-violet-900/35' : selectedNode.type === 'relationship' ? 'border-emerald-300/30 bg-emerald-400/15 shadow-emerald-900/30' : 'border-yellow-200/35 bg-yellow-300/15 shadow-yellow-900/30'}`}>
                    <span className="text-4xl">
                      {selectedNode.type === 'project' ? '▣' : selectedNode.type === 'relationship' ? '●' : '◉'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[22px] font-semibold leading-tight text-white">{selectedNode.label}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/40 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
                        {NODE_TYPES.find(t => t.id === selectedNode.type)?.label || selectedNode.type}
                      </span>
                      {hasSufficientEvidence && nodeInterpretation ? (
                        <span className="rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: `${nodeInterpretation.statusColor}70`, color: nodeInterpretation.statusColor, backgroundColor: `${nodeInterpretation.statusColor}18` }}>
                          {nodeInterpretation.statusLabel}
                        </span>
                      ) : (
                        <span className="rounded-full border border-blue-200/20 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-blue-100/70">
                          Datos fuente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="rounded-full p-2 text-blue-100/55 transition hover:bg-white/10 hover:text-white"
                  aria-label="Cerrar detalle"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-5 border-t border-blue-200/15 pt-4">
                <p className="text-xs font-medium text-blue-200/70">Descripción</p>
                <p className="mt-1 text-base leading-relaxed text-white/92">
                  {selectedNode.metadata?.description || (selectedNode.type === 'self' ? 'Centro de tu mapa' : selectedNode.type === 'project' ? 'Proyecto conectado al observador' : selectedNode.type === 'relationship' ? 'Relación conectada al observador' : 'Elemento conectado')}
                </p>
              </div>

              <div className="mb-5 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-blue-100/75">{selectedNode.type === 'project' ? 'Energía dedicada' : 'Energía del nodo'}</span>
                    <span className="font-semibold text-white">
                      {selectedNode.metadata?.energyInvested != null ? `${selectedNode.metadata.energyInvested}/10` : `${selectedSourceEnergy}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-blue-200/12">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-sky-500" style={{ width: `${selectedNode.metadata?.energyInvested != null ? Math.min(100, Number(selectedNode.metadata.energyInvested) * 10) : selectedSourceEnergy}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-blue-100/75">{selectedNode.type === 'project' ? 'Impacto esperado' : 'Coherencia fuente'}</span>
                    <span className="font-semibold text-white">
                      {selectedNode.metadata?.impactLevel != null ? `${selectedNode.metadata.impactLevel}/10` : `${selectedSourceCoherence}%`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-blue-200/12">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-violet-400" style={{ width: `${selectedNode.metadata?.impactLevel != null ? Math.min(100, Number(selectedNode.metadata.impactLevel) * 10) : selectedSourceCoherence}%` }} />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-blue-100/75">Progreso</span>
                    <span className="font-semibold text-white">{selectedNode.metadata?.progress != null ? `${selectedNode.metadata.progress}%` : '—'}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-blue-200/12">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300" style={{ width: `${selectedNode.metadata?.progress != null ? Math.min(100, Number(selectedNode.metadata.progress)) : 0}%` }} />
                  </div>
                </div>
              </div>

              {!hasSufficientEvidence && (
                <div className="mb-5 rounded-2xl border border-blue-200/15 bg-white/[0.035] p-4">
                  <p className="text-sm font-semibold text-white">Sin diagnóstico todavía</p>
                  <p className="mt-1 text-xs leading-relaxed text-blue-100/65">
                    Faltan {missingEvidence.join(', ') || 'señales'} para activar recomendaciones. Aquí solo mostramos los valores fuente del mapa.
                  </p>
                </div>
              )}

              <div className="mb-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-white/[0.04] p-3">
                  <p className="text-[11px] text-blue-100/50">Vínculos</p>
                  <p className="mt-1 text-lg font-semibold text-cyan-200">{selectedConnections.length}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] p-3">
                  <p className="text-[11px] text-blue-100/50">Fuerza</p>
                  <p className="mt-1 text-lg font-semibold text-violet-200">{selectedConnections.length > 0 ? `${Math.round((selectedConnections.reduce((sum, link) => sum + link.strength, 0) / selectedConnections.length) * 100)}%` : '—'}</p>
                </div>
                <div className="rounded-2xl bg-white/[0.04] p-3">
                  <p className="text-[11px] text-blue-100/50">Cambio</p>
                  <p className="mt-1 truncate text-sm font-semibold text-white">{selectedLastChange || '—'}</p>
                </div>
              </div>

              {selectedConnections.length > 0 && (
                <div className="mb-5 rounded-2xl border border-blue-200/15 bg-slate-950/45 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Network className="h-4 w-4 text-cyan-200" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/55">Conexiones</p>
                  </div>
                  <div className="space-y-2">
                    {selectedConnections.slice(0, 3).map((connection) => (
                      <button
                        key={`${connection.source}-${connection.target}`}
                        onClick={() => connection.otherNode && focusNode(connection.otherNode)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-blue-200/10 bg-white/[0.035] px-3 py-2 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
                      >
                        <span className="min-w-0 truncate text-sm font-medium text-white">{connection.otherNode?.label}</span>
                        <span className="shrink-0 rounded-full bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200">{Math.round(connection.strength * 100)}%</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => focusNode(selectedNode)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-violet-500 px-4 text-sm font-semibold text-slate-950 shadow-lg shadow-violet-500/25 transition hover:brightness-110"
                >
                  <Target className="h-4 w-4" />
                  Centrar en el mapa
                </button>
                {hasSufficientEvidence && nodeInterpretation && (
                  <button
                    onClick={() => analyzeNodeWithAI(selectedNode)}
                    disabled={aiAnalysis.loading}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-blue-200/15 bg-white/[0.04] px-4 text-sm font-medium text-blue-100 transition hover:bg-white/[0.08] disabled:opacity-50"
                  >
                    {aiAnalysis.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    {aiAnalysis.loading ? 'Analizando...' : 'Análisis IA'}
                  </button>
                )}
              </div>

              {hasSufficientEvidence && nodeInterpretation && (
                <div className="mt-5 rounded-2xl border border-blue-200/15 bg-white/[0.035] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">Siguiente acción</span>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">{nodeInterpretation.action}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-blue-100/75">{nodeInterpretation.recommendation}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

export default Scene3D;
