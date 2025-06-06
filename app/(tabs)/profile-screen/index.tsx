import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, StatusBar, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, isLoading, isAuthenticated, logout, testLogin } = useAuth();
  const [statusBarHeight, setStatusBarHeight] = useState(StatusBar.currentHeight || 0);

  const handleLogout = async () => {
    try {
      await logout();
      // Opcionalmente redirigir a la pantalla principal
      router.replace('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleLogin = async () => {
    if (__DEV__) {
      // En desarrollo, mostrar opciones para elegir entre login real o de prueba
      Alert.alert(
        'Iniciar sesión',
        'Selecciona el tipo de inicio de sesión',
        [
          {
            text: 'Login con Google',
            onPress: () => router.push('/auth/LoginScreen')
          },
          {
            text: 'Login de prueba',
            onPress: async () => {
              await testLogin();
            }
          },
          {
            text: 'Cancelar',
            style: 'cancel'
          }
        ]
      );
    } else {
      // En producción, ir directamente a la pantalla de login
      router.push('/auth/LoginScreen');
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        {/* Espacio para la barra de estado en Android */}
        {Platform.OS === 'android' && (
          <View style={{ height: statusBarHeight }} />
        )}

        {/* Cabecera con gradiente */}
        <LinearGradient
          colors={['#1976D2', '#64B5F6']}
          style={styles.header}
        >
          {isAuthenticated ? (
            <>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require('@/assets/images/default-avatar.png')}
                  style={styles.profileImage}
                />
              </View>
              <ThemedText style={styles.userName}>{user?.name}</ThemedText>
              <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            </>
          ) : (
            <View style={styles.notLoggedInContainer}>
              <Ionicons name="person-circle-outline" size={80} color="white" />
              <ThemedText style={styles.notLoggedInText}>No has iniciado sesión</ThemedText>
            </View>
          )}
        </LinearGradient>

        <ScrollView style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1976D2" />
              <ThemedText style={styles.loadingText}>Cargando información...</ThemedText>
            </View>
          ) : (
            <>
              {isAuthenticated ? (
                <>
                  {/* Estadísticas del usuario */}
                  <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>{user?.totalTrips || 0}</ThemedText>
                      <ThemedText style={styles.statLabel}>Viajes</ThemedText>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>{user?.frequentRoutes?.length || 0}</ThemedText>
                      <ThemedText style={styles.statLabel}>Rutas</ThemedText>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statValue}>0</ThemedText>
                      <ThemedText style={styles.statLabel}>Puntos</ThemedText>
                    </View>
                  </View>

                  {/* Opciones de perfil */}
                  <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Mi cuenta</ThemedText>
                    
                    <TouchableOpacity style={styles.menuItem}>
                      <Ionicons name="person" size={24} color="#1976D2" />
                      <ThemedText style={styles.menuItemText}>Editar perfil</ThemedText>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                      <Ionicons name="notifications" size={24} color="#1976D2" />
                      <ThemedText style={styles.menuItemText}>Notificaciones</ThemedText>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                      <Ionicons name="lock-closed" size={24} color="#1976D2" />
                      <ThemedText style={styles.menuItemText}>Privacidad y seguridad</ThemedText>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Preferencias</ThemedText>
                    
                    <TouchableOpacity style={styles.menuItem}>
                      <Ionicons name="map" size={24} color="#1976D2" />
                      <ThemedText style={styles.menuItemText}>Destinos favoritos</ThemedText>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.menuItem}>
                      <Ionicons name="options" size={24} color="#1976D2" />
                      <ThemedText style={styles.menuItemText}>Opciones de transporte</ThemedText>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Botón de cerrar sesión */}
                  <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleLogout}
                  >
                    <Ionicons name="log-out" size={24} color="white" />
                    <ThemedText style={styles.logoutButtonText}>Cerrar sesión</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Usuario no autenticado */}
                  <View style={styles.notLoggedInSection}>
                    <ThemedText style={styles.notLoggedInDescription}>
                      Inicia sesión para acceder a todas las funciones de Smart Mobility, 
                      guardar tus rutas favoritas y sincronizar tus preferencias en todos tus dispositivos.
                    </ThemedText>
                    
                    <TouchableOpacity 
                      style={styles.loginButton}
                      onPress={handleLogin}
                    >
                      <Ionicons name="log-in" size={24} color="white" />
                      <ThemedText style={styles.loginButtonText}>Iniciar sesión</ThemedText>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Sección de ayuda y soporte para todos los usuarios */}
              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Ayuda y soporte</ThemedText>
                
                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="help-circle" size={24} color="#1976D2" />
                  <ThemedText style={styles.menuItemText}>Preguntas frecuentes</ThemedText>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.menuItem}>
                  <Ionicons name="information-circle" size={24} color="#1976D2" />
                  <ThemedText style={styles.menuItemText}>Acerca de</ThemedText>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <ThemedText style={styles.versionText}>Smart Mobility v1.0.0</ThemedText>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 24,
    paddingBottom: 36,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    width: 1,
    height: '70%',
    backgroundColor: '#e0e0e0',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#D32F2F',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  notLoggedInContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  notLoggedInText: {
    fontSize: 18,
    color: 'white',
    marginTop: 12,
  },
  notLoggedInSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notLoggedInDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loginButton: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    width: '100%',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});