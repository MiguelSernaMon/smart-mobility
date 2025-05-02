import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import RecentRoutes from '@/components/plan-trip/RecentRoutes';
import BannerHeader from '@/components/plan-trip/BannerHeader';

export default function PlanTripScreen() {
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  
  // Obtener la altura de la barra de estado al cargar el componente
  useEffect(() => {
    setStatusBarHeight(StatusBar.currentHeight || 0);
  }, []);
  
  const handleSearch = (destination: string) => {
    if (destination.trim()) {
      router.push({
        pathname: '/(tabs)/confirm-route-screen',
        params: { searchQuery: destination }
      });
    }
  };
  
  const handleSelectRecentRoute = (route: any) => {
    // Navegar a la pantalla de confirmación con los datos de la ruta
    router.push({
      pathname: '/(tabs)/confirm-route-screen',
      params: { 
        origin: JSON.stringify(route.origin),
        destination: JSON.stringify(route.destination)
      }
    });
  };
  
  const handleSelectPopularDestination = (destination: any) => {
    router.push({
      pathname: '/(tabs)/confirm-route-screen',
      params: { searchQuery: destination.name }
    });
  };
  
  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        {/* Espacio para la barra de estado en Android */}
        {Platform.OS === 'android' && (
          <View style={{ height: statusBarHeight }} />
        )}
        
        <BannerHeader onSearch={handleSearch} />
        
        <View style={styles.content}>
          {/* Sección de destinos populares */}
          <View style={styles.section}>
            
          </View>
          
          {/* Separador */}
          <View style={styles.divider} />
          
          {/* Sección de rutas recientes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              
            </View>
            <RecentRoutes onSelect={handleSelectRecentRoute} />
          </View>
          
          {/* Tarjeta de consejos */}
          <TouchableOpacity style={styles.tipCard}>
            <View style={styles.tipIconContainer}>
              <Ionicons name="flash" size={24} color="#fff" />
            </View>
            <View style={styles.tipContent}>
              <ThemedText style={styles.tipTitle}>Consejo de viaje</ThemedText>
              <ThemedText style={styles.tipText}>
                Evita las horas pico entre 7-9 AM y 5-7 PM para ahorrar tiempo en tus desplazamientos.
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#1976D2',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
    marginHorizontal: -16,
  },
  tipCard: {
    backgroundColor: '#F5F9FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1976D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  }
});