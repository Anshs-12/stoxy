import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../lib/api';

export interface UserInfo {
  name: string;
  email: string;
  providerType: string;
}

interface AuthContextType {
  user: UserInfo | null;
  isLoggedIn: boolean;
  authLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  authLoading: true,
  logout: () => {},
  refreshUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchUser = () => {
    authApi.getUserInfo()
      .then((r: any) => {
        // Backend returns: { userName, userEmailId, jwtToken, providerType }
        const d = r.data as Record<string, string>;
        setUser({
          name: d.userName ?? d.name ?? 'User',
          email: d.userEmailId ?? d.email ?? '',
          providerType: d.providerType ?? 'GOOGLE',
        });
      })
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  };

  useEffect(() => { fetchUser(); }, []);

  const logout = () => {
    authApi.logout().finally(() => {
      setUser(null);
      window.location.href = '/';
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      authLoading,
      logout,
      refreshUser: fetchUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
