import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { LanguageSelector } from '@/components/LanguageSelector';
import rluLogo from '@/assets/rlu-360-logo.png';
import { Mail, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const { isAuthenticated, login, loginWithEmail, user, getDefaultRoute } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const from = '/data-input';

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login();
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await loginWithEmail(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={rluLogo} alt="RLU 360" className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">RLU 360</h1>
            <p className="text-sm text-muted-foreground">Transformation Model</p>
          </div>
          <div className="flex justify-center">
            <LanguageSelector />
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-xl">{t('auth.welcome')}</CardTitle>
            <CardDescription>
              {showEmailForm ? t('auth.emailLogin') : t('auth.chooseMethod')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!showEmailForm ? (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowEmailForm(true)}
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  {t('auth.emailLogin')}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@rlu360.com"
                    required
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Insert Password"
                      required
                      className="h-12 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12"
                    disabled={isLoading || !email || !password}
                  >
                    {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full"
                    disabled={isLoading}
                  >
                    {t('auth.backToOptions')}
                  </Button>
                </div>
              </form>
            )}

          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>{t('auth.secureLogin')}</p>
        </div>
      </div>
    </div>
  );
};
