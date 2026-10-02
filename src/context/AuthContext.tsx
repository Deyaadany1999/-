import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  mobile: string;
  roleId: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface UserRole {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
}

export interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  permissions: string[];
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (perm: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hse_auth_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('hse_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [role, setRole] = useState<UserRole | null>(() => {
    const cached = localStorage.getItem('hse_role');
    return cached ? JSON.parse(cached) : null;
  });
  const [permissions, setPermissions] = useState<string[]>(() => {
    const cached = localStorage.getItem('hse_permissions');
    return cached ? JSON.parse(cached) : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAdmin = role?.id === 'role-admin' || permissions.includes('USERS_DELETE');

  const checkAuth = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setRole(data.role);
        setPermissions(data.permissions || []);
        localStorage.setItem('hse_user', JSON.stringify(data.user));
        localStorage.setItem('hse_role', JSON.stringify(data.role));
        localStorage.setItem('hse_permissions', JSON.stringify(data.permissions || []));
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (err) {
      console.error('Auth verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [token]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      setUser(data.user);
      setRole(data.role);
      setPermissions(data.permissions || []);

      localStorage.setItem('hse_auth_token', data.token);
      localStorage.setItem('hse_user', JSON.stringify(data.user));
      localStorage.setItem('hse_role', JSON.stringify(data.role));
      localStorage.setItem('hse_permissions', JSON.stringify(data.permissions || []));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // Ignore network error on logout
      }
    }
    setToken(null);
    setUser(null);
    setRole(null);
    setPermissions([]);
    localStorage.removeItem('hse_auth_token');
    localStorage.removeItem('hse_user');
    localStorage.removeItem('hse_role');
    localStorage.removeItem('hse_permissions');
  };

  const hasPermission = (perm: string): boolean => {
    if (!user) return false;
    if (role?.id === 'role-admin') return true;
    return permissions.includes(perm);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        isAdmin,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
