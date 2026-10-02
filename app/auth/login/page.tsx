
import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            OBSERVADOR 4D
          </h1>
          <p className="text-slate-400 mt-2">
            Entra a tu centro de memoria, decisiones y visualización 4D
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
