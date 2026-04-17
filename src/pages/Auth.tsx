import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Loader2, AlertTriangle, UserPlus, LogIn, Target, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn, signUp, user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('mode') === 'signup') {
      setIsLogin(false);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setIsLogin(false);
      }
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        setIsLogin(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      const errorMsg = (error as Error).message;
      setErrorMessage(errorMsg);
    }
  };

  const isEmailProviderDisabled =
    errorMessage?.includes('Email logins are disabled') ||
    errorMessage?.includes('Email signups are disabled');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Soft gradient backdrop */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'var(--gradient-hero)' }}
        aria-hidden
      />
      <div
        className="absolute -top-40 -right-40 h-96 w-96 rounded-full opacity-30 blur-3xl pointer-events-none"
        style={{ background: 'var(--gradient-hero)' }}
        aria-hidden
      />
      <div
        className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'var(--gradient-hero)' }}
        aria-hidden
      />

      {/* Top bar */}
      <header className="relative z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[image:var(--gradient-hero)] flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg">ActionPoint</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[image:var(--gradient-hero)] shadow-[var(--shadow-glow)]">
              {isLogin ? (
                <LogIn className="h-6 w-6 text-white" />
              ) : (
                <UserPlus className="h-6 w-6 text-white" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Sign in to keep your team accountable.'
                : 'Get started — set up your workspace in minutes.'}
            </p>
          </div>

          <Card className="border-border/50 shadow-[var(--shadow-card)] backdrop-blur bg-background/80">
            <CardContent className="p-6 md:p-8">
              {/* Tab switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted mb-6">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`text-sm font-medium py-2 rounded-md transition-all ${
                    isLogin
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`text-sm font-medium py-2 rounded-md transition-all ${
                    !isLogin
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 text-sm text-destructive-foreground bg-destructive rounded-md">
                    {errorMessage}
                  </div>
                )}

                {isEmailProviderDisabled && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Email authentication is currently disabled. Please enable it in your
                      Supabase dashboard under Authentication → Providers → Email.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || isEmailProviderDisabled}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {isLogin ? (
                        <LogIn className="mr-2 h-4 w-4" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {isLogin ? 'Sign in' : 'Create account'}
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-primary hover:underline"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Free to start · No credit card required · Set up in minutes
          </p>
        </div>
      </main>
    </div>
  );
}
