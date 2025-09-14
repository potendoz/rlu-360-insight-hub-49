import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { ShieldX, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AccessDenied = () => {
  const { user, logout, getDefaultRoute } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleGoBack = () => {
    const defaultRoute = getDefaultRoute();
    navigate(defaultRoute);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-destructive/5 via-background to-muted/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div>
            <CardTitle className="text-xl text-destructive">
              {t('auth.accessDenied')}
            </CardTitle>
            <CardDescription className="mt-2">
              {t('auth.accessDeniedMessage')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {user && (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.currentUser')}
              </p>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">
                {t('auth.role')}: {user.role}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={handleGoBack} className="w-full" variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.goToDashboard')}
            </Button>

            <Button onClick={handleLogout} className="w-full" variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('auth.logout')}
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>{t('auth.contactAdmin')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};