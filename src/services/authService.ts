import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'physician' | 'judge' | 'lab_manager';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };

  private listeners: Array<(state: AuthState) => void> = [];


  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const savedAuth = sessionStorage.getItem('rlu360_auth');
      if (savedAuth) {
        const user = JSON.parse(savedAuth);
        this.authState = {
          user,
          isAuthenticated: true,
          isLoading: false
        };
      } else {
        this.authState.isLoading = false;
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this.authState.isLoading = false;
    }
    this.notifyListeners();
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.authState));
  }

  private async getUserFromDatabase(email: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Database query error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database connection error:', error);
      return null;
    }
  }

  async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      // In a real implementation, you would use Google OAuth
      // For now, we'll simulate the OAuth flow
      return new Promise((resolve) => {
        // Simulate OAuth popup
        const popup = window.open(
          'about:blank',
          'google-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        // Simulate user selection for demo
        setTimeout(() => {
          popup?.close();
          // Simulate successful OAuth response
          const mockGoogleUser = {
            email: 'doctor@rlu360.com', // This would come from Google
            name: 'Dr. Somchai',
            picture: ''
          };
          
          this.handleOAuthCallback(mockGoogleUser.email, mockGoogleUser.name)
            .then(resolve)
            .catch((error) => resolve({ success: false, error: error.message }));
        }, 2000);
      });
    } catch (error) {
      return { success: false, error: 'Google login failed' };
    }
  }

  async loginWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get user from database first
      const userData = await this.getUserFromDatabase(email);
      if (!userData) {
        return { success: false, error: 'User not found or inactive' };
      }

      // Check if password matches
      if (userData.password !== password) {
        return { success: false, error: 'Invalid email or password' };
      }

      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatar: userData.avatar_url
      };

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      this.setUser(user);
      this.logAuthEvent(user.id, user.role, 'email_login', 'success');

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  private async handleOAuthCallback(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
    // Get user from database
    const userData = await this.getUserFromDatabase(email);
    if (!userData) {
      return { success: false, error: 'Your email address is not authorized to access this system' };
    }

    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar_url
    };

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userData.id);

    this.setUser(user);
    this.logAuthEvent(user.id, user.role, 'google_oauth', 'success');

    return { success: true };
  }

  private setUser(user: User) {
    this.authState = {
      user,
      isAuthenticated: true,
      isLoading: false
    };
    
    sessionStorage.setItem('rlu360_auth', JSON.stringify(user));
    this.notifyListeners();
  }

  logout() {
    this.authState = {
      user: null,
      isAuthenticated: false,
      isLoading: false
    };
    
    sessionStorage.removeItem('rlu360_auth');
    this.logAuthEvent(
      this.authState.user?.id || 'unknown',
      this.authState.user?.role || 'unknown',
      'logout',
      'success'
    );
    this.notifyListeners();
  }

  getCurrentUser(): User | null {
    return this.authState.user;
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  hasRole(role: string): boolean {
    return this.authState.user?.role === role;
  }

  async canAccessRoute(route: string): Promise<boolean> {
    if (!this.authState.isAuthenticated) return false;
    
    const role = this.authState.user?.role;
    if (!role) return false;

    console.log('Checking route access:', { role, route });

    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('can_access')
        .eq('role', role)
        .eq('route', route)
        .maybeSingle();

      if (error) {
        console.error('Error checking route permissions:', error);
        return false;
      }

      console.log('Permission query result:', data);
      const hasAccess = data?.can_access || false;
      console.log('Final access decision:', hasAccess);
      
      return hasAccess;
    } catch (error) {
      console.error('Error querying role permissions:', error);
      return false;
    }
  }

  getDefaultRoute(): string {
    const role = this.authState.user?.role;
    switch (role) {
      case 'admin':
        return '/admin';
      case 'physician':
        return '/dashboard';
      case 'lab_manager':
        return '/dashboard';
      case 'judge':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  }

  private logAuthEvent(userId: string, role: string, action: string, status: string) {
    const event = {
      user_id: userId,
      role,
      action,
      status,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    };
    
    console.log('Auth Event:', event);
    
    // In production, send to analytics service
    // analytics.track('auth_event', event);
  }
}

export const authService = AuthService.getInstance();
export type { User, AuthState };