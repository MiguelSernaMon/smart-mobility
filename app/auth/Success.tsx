import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AuthSuccessScreen() {
  const router = useRouter();
  const { checkAuthStatus } = useAuth();

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        const isAuthenticated = await checkAuthStatus();
        
        if (isAuthenticated) {
          // Navegar a la pantalla principal
          router.replace('/(tabs)');
        } else {
          // Si hay algún problema, volver a la pantalla de login
          router.replace('/auth/LoginScreen');
        }
      } catch (error) {
        console.error('Error en la redirección de autenticación:', error);
        ('/auth/LoginScreen');
      }
    };

    // Pequeño retraso para asegurarse de que las cookies se han guardado
    setTimeout(handleSuccess, 500);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1976D2" />
      <Text style={styles.text}>Iniciando sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#333',
  },
});