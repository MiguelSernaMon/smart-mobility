import React, { createContext, useState, useEffect, useContext } from 'react';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

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
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  testLogin: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

// Crear el contexto
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  testLogin: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => false,
});

// URL base del API directamente hardcodeada para debugging
// Usa 10.0.2.2 para emuladores Android, localhost para iOS y tu IP real para dispositivos físicos
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api', // Para emulador Android
  ios: 'http://localhost:3000/api',     // Para emulador iOS
  default: 'http://192.168.1.100:3000/api' // Cambia esto a tu IP real para dispositivos físicos
});

// Muestra la URL base en consola para debugging
console.log('🚀 API Base URL:', API_BASE_URL);

// Proveedor del contexto
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar estado de autenticación al cargar
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Verificar si el usuario está autenticado
  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Verificando estado de autenticación...');
      
      const response = await fetch(`${API_BASE_URL}/auth/check`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Respuesta recibida:', response.status);
      
      const data = await response.json();
      console.log('📄 Datos recibidos:', data);
      
      if (data.success && data.authenticated) {
        console.log('👤 Usuario autenticado:', data.user);
        setUser(data.user);
        return true;
      } else {
        console.log('❌ Usuario no autenticado');
        setUser(null);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error verificando autenticación:', error);
      console.error('Mensaje:', error.message);
      // Si hay un error de red, podría ser un problema de conexión o CORS
      if (error.message.includes('Network request failed')) {
        console.log('🌐 Posible error de red o CORS. Verifica que:');
        console.log('1. El servidor esté ejecutándose en ' + API_BASE_URL);
        console.log('2. CORS esté configurado correctamente en el servidor');
        console.log('3. Si estás en un dispositivo físico, la IP sea accesible');
      }
      
      setUser(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Función para iniciar sesión con Google
  const login = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔑 Iniciando sesión con Google...');
      
      // Abrimos el navegador con la URL de autenticación de Google
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE_URL}/auth/google`,
        // Usar una URL de retorno fija para depuración
        'exp://'
      );
      
      console.log('🔄 Respuesta del navegador:', result.type);
      
      if (result.type === 'success') {
        console.log('✅ Navegación exitosa, verificando autenticación...');
        await checkAuthStatus();
      } else {
        console.log('❌ Error en la navegación:', result);
        Alert.alert('Error', 'No se pudo iniciar sesión con Google');
      }
    } catch (error: any) {
      console.error('❌ Error en inicio de sesión:', error);
      console.error('Mensaje:', error.message);
      Alert.alert('Error', 'Ocurrió un error al intentar iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  // Login de prueba (solo para desarrollo)
  const testLogin = async () => {
    try {
      setIsLoading(true);
      console.log('🧪 Ejecutando login de prueba...');
      
      const response = await fetch(`${API_BASE_URL}/auth/test-login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Respuesta de test-login:', response.status);
      const data = await response.json();
      console.log('📄 Datos recibidos:', data);
      
      if (data.success) {
        console.log('👤 Usuario de prueba:', data.user);
        setUser(data.user);
      } else {
        console.log('❌ Error en login de prueba:', data.message);
        Alert.alert('Error', data.message || 'Error en inicio de sesión de prueba');
      }
    } catch (error: any) {
      console.error('❌ Error en login de prueba:', error);
      console.error('Mensaje:', error.message);
      Alert.alert('Error', 'Ocurrió un error al intentar el login de prueba');
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('🚪 Cerrando sesión...');
      
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('✅ Respuesta de logout:', response.status);
      const data = await response.json();
      console.log('📄 Datos recibidos:', data);
      
      if (data.success) {
        console.log('👋 Sesión cerrada exitosamente');
        setUser(null);
      } else {
        console.log('❌ Error al cerrar sesión:', data.message);
        Alert.alert('Error', 'No se pudo cerrar sesión');
      }
    } catch (error: any) {
      console.error('❌ Error al cerrar sesión:', error);
      console.error('Mensaje:', error.message);
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
        isLoading, 
        isAuthenticated: !!user, 
        login, 
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