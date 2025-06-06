import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Platform, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import Constants from 'expo-constants';

export default function LoginScreen() {
  const { login, testLogin, isLoading } = useAuth();
  // Antes de definir AuthProvider, añade esto:
  const router = useRouter();
  const [isDev] = useState(__DEV__);

  const handleGoogleLogin = async () => {
    try {
      await login();
      // El redireccionamiento se maneja en el AuthContext
    } catch (error) {
      console.error('Error durante el login:', error);
    }
  };

  const handleTestLogin = async () => {
    try {
      await testLogin();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error durante el login de prueba:', error);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Smart Mobility</Text>
        <Text style={styles.tagline}>Tu asistente de movilidad urbana</Text>
      </View>

      <View style={styles.formContainer}>
        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Image 
            source={require('@/assets/images/google-logo.png')} 
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Continuar con Google</Text>
        </TouchableOpacity>

        {isDev && (
          <TouchableOpacity 
            style={[styles.googleButton, styles.testButton]}
            onPress={handleTestLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Login de prueba (solo dev)</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={styles.skipText}>Continuar sin iniciar sesión</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1976D2" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1976D2',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  formContainer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testButton: {
    backgroundColor: '#E3F2FD',
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  skipButton: {
    alignItems: 'center',
    padding: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});