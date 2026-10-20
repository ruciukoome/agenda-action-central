import { PublicShell } from "@/components/layout/primitives";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Loader2, AlertTriangle, UserPlus, LogIn, Target, ArrowLeft, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signupConfirmEmail, setSignupConfirmEmail] = useState<string | null>(null);
  const { signIn, signUp, user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("mode") === "signup") {
      setIsLogin(false);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      const fromPath = location.state?.from?.pathname;
      // Never bounce back to landing or auth — send authed users to the app
      const target = !fromPath || fromPath === "/" || fromPath === "/auth" ? "/app" : fromPath;
      navigate(target, { replace: true });
    }
  }, [user, navigate, location]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "s") {
        e.preventDefault();
        setIsLogin(false);
      }
      if (e.altKey && e.key === "l") {
        e.preventDefault();
        setIsLogin(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        const { needsEmailConfirmation } = await signUp(email, password);
        if (needsEmailConfirmation) {
          // Show popup with instructions; user lands on /onboarding after confirming
          setSignupConfirmEmail(email);
        } else {
          // Auto-confirmed (e.g. confirmations disabled) — go straight to onboarding
          toast({
            title: "Account created",
            description: "Let's set up your organization.",
          });
          navigate("/onboarding", { replace: true });
        }
      }
    } catch (error) {
      const errorMsg = (error as Error).message;
      setErrorMessage(errorMsg);
    }
  };

  const isEmailProviderDisabled =
    errorMessage?.includes("Email logins are disabled") || errorMessage?.includes("Email signups are disabled");

  return (
    <PublicShell
      headerAction={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </Button>
      }
    >
      {/* Main */}
      <div className="flex w-full items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-hero shadow-glow">
              {isLogin ? <LogIn className="h-6 w-6 text-brand-foreground" /> : <UserPlus className="h-6 w-6 text-brand-foreground" />}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Sign in to keep your team accountable." : "Get started — set up your workspace in minutes."}
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
                    isLogin ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`text-sm font-medium py-2 rounded-md transition-all ${
                    !isLogin ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
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
                      Email authentication is currently disabled. Please enable it in your Supabase dashboard under
                      Authentication → Providers → Email.
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

                <Button type="submit" size="lg" className="w-full" disabled={isLoading || isEmailProviderDisabled}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {isLogin ? <LogIn className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      {isLogin ? "Sign in" : "Create account"}
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground pt-2">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="font-medium text-primary hover:underline"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Free to start · No credit card required · Set up in minutes
          </p>
        </div>
      </div>

      {/* Email confirmation dialog after signup */}
      <Dialog
        open={!!signupConfirmEmail}
        onOpenChange={(open) => {
          if (!open) {
            setSignupConfirmEmail(null);
            setIsLogin(true);
            setPassword("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-glow mb-2">
              <Mail className="h-6 w-6 text-brand-foreground" />
            </div>
            <DialogTitle className="text-center text-xl">Confirm your email</DialogTitle>
            <DialogDescription className="text-center pt-2">
              We sent a confirmation link to <span className="font-medium text-foreground">{signupConfirmEmail}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>Open your inbox and look for the email from ActionsPoint.</li>
              <li>Click the confirmation link to activate your account.</li>
              <li>You'll be guided to set up or join your organization.</li>
            </ol>
            <p className="text-xs">Don't see it? Check your spam folder, or wait a minute and try again.</p>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => {
                setSignupConfirmEmail(null);
                setIsLogin(true);
                setPassword("");
              }}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PublicShell>
  );
}
