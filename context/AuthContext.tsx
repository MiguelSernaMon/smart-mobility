import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Definir la interfaz del usuario
export interface User {
  id: string;
  name: string;
  email: string;
  frequentRoutes?: any[];
  totalTrips?: number;
  lastActive?: string;
}

// Definir el contexto de autenticación
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  testLogin: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

// URL base del API
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api', // Para emulador Android
  ios: 'http://localhost:3000/api',     // Para emulador iOS
  default: 'http://192.168.1.100:3000/api' // Cambia esto a tu IP real para dispositivos físicos
});

// Crear el contexto
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  testLogin: async () => false,
  logout: async () => {},
  checkAuthStatus: async () => false,
});

// Proveedor del contexto
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Guardar token en AsyncStorage
  const saveToken = async (newToken: string) => {
    try {
      await AsyncStorage.setItem('authToken', newToken);
      setToken(newToken);
    } catch (error) {
      console.error('Error guardando token:', error);
    }
  };

  // Borrar token de AsyncStorage
  const removeToken = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setToken(null);
    } catch (error) {
      console.error('Error eliminando token:', error);
    }
  };

  // Verificar si el usuario está autenticado
  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Obtener token guardado
      const savedToken = await AsyncStorage.getItem('authToken');
      
      if (!savedToken) {
        console.log('No hay token guardado');
        setUser(null);
        setIsLoading(false);
        return false;
      }
      
      // Verificar token con el servidor
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.user) {
        console.log('Usuario autenticado:', data.user);
        setUser(data.user);
        setToken(savedToken);
        setIsLoading(false);
        return true;
      } else {
        console.log('Token inválido o expirado');
        await removeToken();
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Error verificando autenticación:', error);
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  // Login con email y contraseña
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        await saveToken(data.token);
        setUser(data.user);
        return true;
      } else {
        Alert.alert('Error', data.message || 'Credenciales inválidas');
        return false;
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar iniciar sesión');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Registro de nuevo usuario
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log(`Intentando conectar a: ${API_BASE_URL}/auth/register`);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (data.success && data.token) {
        await saveToken(data.token);
        setUser(data.user);
        return true;
      } else {
        Alert.alert('Error', data.message || 'No se pudo registrar el usuario');
        return false;
      }
    } catch (error: any) {
      console.error('Error en registro (detallado):', error);
      console.error('Tipo de error:', typeof error);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      
      Alert.alert(
        'Error de conexión', 
        'No se pudo conectar al servidor. Verifica tu conexión y que el servidor esté activo.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login de prueba (solo para desarrollo)
  const testLogin = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/test-account`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.token) {
        await saveToken(data.token);
        setUser(data.user);
        return true;
      } else {
        Alert.alert('Error', data.message || 'Error en inicio de sesión de prueba');
        return false;
      }
    } catch (error: any) {
      console.error('Error en login de prueba:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar el login de prueba');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await removeToken();
      setUser(null);
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'Ocurrió un error al intentar cerrar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Retornar el proveedor con todos los valores necesarios
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token,
        isLoading, 
        isAuthenticated: !!user, 
        login, 
        register,
        testLogin, 
        logout,
        checkAuthStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => useContext(AuthContext);