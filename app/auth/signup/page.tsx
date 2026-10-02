
import SignupForm from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            OBSERVADOR 4D
          </h1>
          <p className="text-slate-400 mt-2">
            Crea tu cuenta para mapear proyectos, energía y decisiones
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
