import { useState, useEffect } from 'react';
import { authService, type AuthState } from '@/services/authService';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  const canAccessRoute = async (route: string) => {
    return await authService.canAccessRoute(route);
  };

  return {
    ...authState,
    login: authService.loginWithGoogle.bind(authService),
    loginWithEmail: authService.loginWithEmail.bind(authService),
    logout: authService.logout.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    canAccessRoute,
    getDefaultRoute: authService.getDefaultRoute.bind(authService)
  };
};