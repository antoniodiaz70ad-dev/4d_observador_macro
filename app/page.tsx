
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Brain, Target, Sparkles, ArrowRight, Play } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-purple-900/20" />
        
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <div className="relative w-full h-full">
            <Image
              src="https://static.abacusaicdn.net/images/6724d069-5237-43ef-a53a-0079d1695f63.jpg"
              alt="Cosmic background"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-16 h-16">
                <Image
                  src="https://static.abacusaicdn.net/images/8b3c86df-3ee5-498b-b24a-abe5f9430807.jpg"
                  alt="Third Eye Symbol"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                OBSERVADOR
              </span>
              <br />
              <span className="text-4xl md:text-5xl text-cyan-300">4D</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Un centro de comando para registrar decisiones, observar patrones en 3D/4D y usar IA para convertir evidencia en próximos movimientos.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white text-lg px-8 py-4">
                  <Play className="mr-2 h-5 w-5" />
                  Crear cuenta
                </Button>
              </Link>
              
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="border-purple-400/50 text-purple-300 hover:bg-purple-500/10 text-lg px-8 py-4">
                  <Eye className="mr-2 h-5 w-5" />
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative mx-auto max-w-4xl">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-900/50 backdrop-blur-sm">
              <Image
                src="https://static.abacusaicdn.net/images/7d2fc79d-debc-46b9-8d7e-45c7a609e3f4.png"
                alt="Consciousness Expansion - Person viewing life from 4D perspective"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-white text-xl font-semibold mb-2">
                  Ejemplo: convierte capturas en decisiones visibles
                </h3>
                <p className="text-slate-300">
                  Registra un estado, compara el antes/después y abre el mapa 3D para ver relaciones, energía y tensión.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Concepto 3D vs 4D */}
      <section className="py-20 bg-gradient-to-b from-transparent to-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              La Transición <span className="text-purple-400">Dimensional</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Pasa de reaccionar a eventos sueltos a mirar evidencia, relaciones y decisiones dentro de un sistema
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Modo 3D */}
            <Card className="bg-red-900/20 border-red-500/30 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl font-bold text-red-400">3D</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Modo Reactivo</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">•</span>
                    <div>
                      <h4 className="text-white font-semibold">Yo físico dentro del entorno</h4>
                      <p className="text-slate-400">Te identificas con tu experiencia inmediata</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">•</span>
                    <div>
                      <h4 className="text-white font-semibold">Energía reactiva y lineal</h4>
                      <p className="text-slate-400">Respondes a las circunstancias externas</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">•</span>
                    <div>
                      <h4 className="text-white font-semibold">Resultado: Esfuerzo y fricción</h4>
                      <p className="text-slate-400">Manifestaciones lentas y con resistencia</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modo 4D */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-2xl font-bold text-white">4D</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">Modo Estratégico</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">•</span>
                    <div>
                      <h4 className="text-white font-semibold">Yo observador del sistema</h4>
                      <p className="text-slate-400">Ves tu vida desde una perspectiva superior</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">•</span>
                    <div>
                      <h4 className="text-white font-semibold">Energía cuántica y estratégica</h4>
                      <p className="text-slate-400">Actúas desde la intención consciente</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">•</span>
                    <div>
                      <h4 className="text-white font-semibold">Resultado: Flujo y sincronía</h4>
                      <p className="text-slate-400">Manifestaciones rápidas y armoniosas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Características de la Plataforma */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Herramientas de <span className="text-cyan-400">Expansión</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Herramientas para capturar memoria, visualizar relaciones y decidir con más claridad
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Dashboard 4D */}
            <Card className="bg-slate-900/50 border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all hover:shadow-lg hover:shadow-purple-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Dashboard de Visión 4D</h3>
                <p className="text-slate-400 mb-4">
                  Visualiza tu vida como un tablero de juego interactivo desde la perspectiva del observador superior.
                </p>
                <div className="relative aspect-video bg-gradient-to-br from-purple-900/30 to-transparent rounded-lg overflow-hidden border border-purple-500/20">
                  <Image
                    src="https://static.abacusaicdn.net/images/e9e50ee5-6850-4683-ad8d-0390759686de.jpg"
                    alt="Network connections visualization"
                    fill
                    className="object-cover opacity-60"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Medidor de Coherencia */}
            <Card className="bg-slate-900/50 border-cyan-500/30 backdrop-blur-sm hover:border-cyan-400/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Medidor de Coherencia</h3>
                <p className="text-slate-400 mb-4">
                  Mide tu alineación entre emociones, lógica y energía para optimizar tu frecuencia dimensional.
                </p>
                <div className="relative aspect-video bg-gradient-to-br from-cyan-900/30 to-transparent rounded-lg overflow-hidden border border-cyan-500/20">
                  <Image
                    src="https://static.abacusaicdn.net/images/93ba7fd6-2823-4727-be2e-1475e14fdcfe.jpg"
                    alt="Sacred geometry - Flower of Life"
                    fill
                    className="object-cover opacity-60"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sistema de Manifestación */}
            <Card className="bg-slate-900/50 border-yellow-500/30 backdrop-blur-sm hover:border-yellow-400/50 transition-all hover:shadow-lg hover:shadow-yellow-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Manifestación Estratégica</h3>
                <p className="text-slate-400 mb-4">
                  Programa y rastrea tus intenciones desde la perspectiva dimensional para manifestar con precisión.
                </p>
                <div className="relative aspect-video bg-gradient-to-br from-yellow-900/30 to-transparent rounded-lg overflow-hidden border border-yellow-500/20">
                  <Image
                    src="https://static.abacusaicdn.net/images/3ab46aa5-d2d2-438f-b11f-24347ec2947b.jpg"
                    alt="Energy flow and manifestation"
                    fill
                    className="object-cover opacity-60"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mapeo de Patrones */}
            <Card className="bg-slate-900/50 border-green-500/30 backdrop-blur-sm hover:border-green-400/50 transition-all hover:shadow-lg hover:shadow-green-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Detección de Sincronicidades</h3>
                <p className="text-slate-400 mb-4">
                  Identifica patrones fractales y sincronicidades en tu experiencia para fortalecer tu conexión 4D.
                </p>
                <div className="relative aspect-video bg-gradient-to-br from-green-900/30 to-transparent rounded-lg overflow-hidden border border-green-500/20">
                  <Image
                    src="https://static.abacusaicdn.net/images/ff31f004-0231-46a2-a5b8-1fb94a1eb0fa.jpg"
                    alt="Sri Yantra sacred geometry"
                    fill
                    className="object-cover opacity-60"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ejercicios de Elevación */}
            <Card className="bg-slate-900/50 border-indigo-500/30 backdrop-blur-sm hover:border-indigo-400/50 transition-all hover:shadow-lg hover:shadow-indigo-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Ejercicios de Elevación</h3>
                <p className="text-slate-400 mb-4">
                  Prácticas guiadas para desarrollar tu capacidad de observación 4D y codificación de intenciones.
                </p>
                <div className="relative aspect-video bg-gradient-to-br from-indigo-900/30 to-transparent rounded-lg overflow-hidden border border-indigo-500/20">
                  <Image
                    src="https://static.abacusaicdn.net/images/871f0ed2-7cca-4d5e-b93a-6d593c46d83c.jpg"
                    alt="Merkaba star tetrahedron"
                    fill
                    className="object-cover opacity-60"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Análisis Dimensional */}
            <Card className="bg-slate-900/50 border-pink-500/30 backdrop-blur-sm hover:border-pink-400/50 transition-all hover:shadow-lg hover:shadow-pink-500/20">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-pink-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Análisis Dimensional</h3>
                <p className="text-slate-400 mb-4">
                  Recibe insights automáticos sobre tus patrones de comportamiento y evolución de conciencia.
                </p>
                <div className="relative aspect-video bg-gradient-to-br from-pink-900/30 to-transparent rounded-lg overflow-hidden border border-pink-500/20">
                  <Image
                    src="https://static.abacusaicdn.net/images/175ce93b-f3d9-42fc-adc9-a0328d8c4afc.jpg"
                    alt="Infinity DNA helix"
                    fill
                    className="object-cover opacity-60"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-t from-slate-900 to-transparent">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Inicia tu <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Expansión 4D</span>
          </h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Transforma tu realidad desde la macrovisión. Desarrolla la conciencia del observador y manifiesta con flujo dimensional.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white text-lg px-8 py-4">
                <Play className="mr-2 h-5 w-5" />
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="text-slate-500 text-sm mt-6">
            Únete a los observadores que ya están manifestando desde el 4D
          </p>
        </div>
      </section>
    </div>
  );
}
