import { Image, StyleSheet, Platform, SafeAreaView, View, TextInput, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation, usePathname } from 'expo-router'; // Importar usePathname
import AsyncStorage from '@react-native-async-storage/async-storage';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getPopularDestinations, getRecentDestinations, Destination } from '@/utils/destinationStorage';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const [popularPlaces, setPopularPlaces] = useState<Destination[]>([]);
  const [recentTrips, setRecentTrips] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname(); // Obtener pathname actual

  // Efecto para cargar cuando el componente monta
  useEffect(() => {
    setStatusBarHeight(StatusBar.currentHeight || 0);
    refreshDestinations();
  }, []);

  // Reemplazar el listener de focus con un efecto que observe cambios en pathname
  // Este efecto se ejecutará cada vez que el usuario regrese a la pantalla de inicio
  useEffect(() => {
    if (pathname === '/(tabs)' || pathname === '/(tabs)/index') {
      console.log('Home screen focused, refreshing destinations...');
      refreshDestinations();
    }
  }, [pathname]);

  // Función para actualizar los destinos
  const refreshDestinations = async () => {
    setIsLoading(true);
    try {
      const popular = await getPopularDestinations(4);
      const recent = await getRecentDestinations(3);
      
      console.log(`Cargados ${popular.length} destinos populares y ${recent.length} recientes`);
      
      setPopularPlaces(popular);
      setRecentTrips(recent);
    } catch (error) {
      console.error('Error al cargar destinos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navegar a la pantalla de confirmación de ruta con el query como parámetro
      router.push({
        pathname: '/(tabs)/confirm-route-screen',
        params: { searchQuery }
      });
    }
  };

  const handleDestinationPress = (destination: Destination) => {
    // Navegar directamente a la pantalla de confirmación con las coordenadas
    router.push({
      pathname: '/(tabs)/confirm-route-screen',
      params: { 
        destinationName: destination.name,
        destinationLat: destination.coordinates.latitude.toString(),
        destinationLng: destination.coordinates.longitude.toString()
      }
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
      {/* Barra de búsqueda con margen superior adecuado */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="location" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="¿A dónde vas?"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerHeight={300}
        headerImage={
          <Image
            source={require('@/assets/images/hero2.png')}
            style={styles.reactLogo}
            resizeMode="cover"
          />
        }>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Smart Mobility</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Tus lugares preferidos</ThemedText>
          {isLoading ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <PopularDestinations 
              destinations={popularPlaces} 
              onDestinationPress={handleDestinationPress} 
            />
          )}
        </ThemedView>
        
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Últimos viajes</ThemedText>
          {isLoading ? (
            <ActivityIndicator size="small" color="#1976D2" />
          ) : (
            <RecentTrips 
              trips={recentTrips}
              onTripPress={handleDestinationPress}
            />
          )}
        </ThemedView>
      </ParallaxScrollView>
    </SafeAreaView>
    </>
  );
}

// Componente para mostrar destinos populares
const PopularDestinations = ({ destinations, onDestinationPress }) => {
  // Verificar si hay destinos
  if (!destinations || destinations.length === 0) {
    return (
      <View style={styles.emptyDestinationsContainer}>
        <Ionicons name="star-outline" size={40} color="#ccc" />
        <ThemedText style={styles.emptyDestinationsText}>
          Los lugares que más visites aparecerán aquí
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.popularDestinations}>
      {destinations.map((destination, index) => (
        <TouchableOpacity 
          key={destination.id || index} 
          style={styles.destinationItem}
          onPress={() => onDestinationPress(destination)}
        >
          <Ionicons name={destination.icon} size={24} color="#1976D2" />
          <ThemedText numberOfLines={1} style={styles.destinationText}>
            {destination.name}
          </ThemedText>
          {destination.count > 0 && (
            <ThemedText style={styles.countBadge}>
              {destination.count}x
            </ThemedText>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Componente para mostrar viajes recientes
const RecentTrips = ({ trips, onTripPress }) => {
  if (!trips || trips.length === 0) {
    // Mostrar mensaje cuando no hay viajes recientes
    return (
      <View style={styles.emptyTripsContainer}>
        <Ionicons name="time-outline" size={40} color="#ccc" />
        <ThemedText style={styles.emptyTripsText}>
          Aquí aparecerá tu historial de viajes
        </ThemedText>
      </View>
    );
  }

  // Formatear fecha
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Hoy';
    if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
    
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.recentTrips}>
      {trips.map((trip, index) => (
        <TouchableOpacity 
          key={trip.id || index} 
          style={styles.tripItem}
          onPress={() => onTripPress(trip)}
        >
          <View style={styles.tripIconContainer}>
            <Ionicons name={trip.icon || "time"} size={20} color="#666" />
          </View>
          <View style={styles.tripDetails}>
            <ThemedText style={styles.tripText}>{trip.name}</ThemedText>
            <ThemedText style={styles.tripDate}>
              {trip.address} • {formatDate(trip.lastUsed)}
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 4 : 12,
    paddingBottom: 12,
    backgroundColor: '#f1f1f1',
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#1976D2',
    width: 46,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 3,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepContainer: {
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  reactLogo: {
    width: '100%',
    height: '100%',
  },
  popularDestinations: {
    marginTop: 8,
  },
  destinationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  destinationText: {
    marginLeft: 10,
    fontSize: 15,
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#1976D2',
    color: 'white',
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recentTrips: {
    marginTop: 8,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tripIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripDetails: {
    flex: 1,
  },
  tripText: {
    fontSize: 15,
  },
  tripDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  // Estilos para estados vacíos
  emptyTripsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 8,
  },
  emptyTripsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
  emptyDestinationsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginTop: 8,
  },
  emptyDestinationsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
  },
});