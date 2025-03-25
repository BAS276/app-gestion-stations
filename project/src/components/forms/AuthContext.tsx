import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface User {
  _id: string;
  nom: string;
  email: string;
  role: 'manager' | 'mainManager' | 'admin';
  station?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Added loading state
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Added loading state

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get<User>('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
          setIsAuthenticated(true);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        })
        .catch((err) => {
          console.error('Erreur lors de la vérification du token:', err);
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setIsLoading(false); // Set loading to false after the request completes
        });
    } else {
      setIsLoading(false); // No token, no need to load
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<AuthResponse>('http://localhost:5000/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err);
      const errorMessage = err.response?.data?.message || 'Une erreur est survenue lors de la connexion';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};