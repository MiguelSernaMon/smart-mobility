import { Image, StyleSheet, Platform, SafeAreaView, View, TextInput, TouchableOpacity, StatusBar } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  useEffect(() => {
    setStatusBarHeight(StatusBar.currentHeight || 0);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navegar a la pantalla de confirmación de ruta con el query como parámetro
      router.push({
        pathname: '/(tabs)/confirm-route-screen',
        params: { searchQuery }
      });
    }
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
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Smart Mobility</ThemedText>
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Destinos populares</ThemedText>
          <PopularDestinations />
        </ThemedView>
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">Últimos viajes</ThemedText>
          <RecentTrips />
        </ThemedView>
      </ParallaxScrollView>
    </SafeAreaView>
    </>
  );
}

// Componente para mostrar destinos populares
const PopularDestinations = () => {
  const destinations = [
    { name: "Universidad de Antioquia", icon: "school" },
    { name: "Centro Comercial El Tesoro", icon: "cart" },
    { name: "Parque Arví", icon: "leaf" },
    { name: "Aeropuerto José María Córdova", icon: "airplane" }
  ];

  return (
    <View style={styles.popularDestinations}>
      {destinations.map((destination, index) => (
        <TouchableOpacity key={index} style={styles.destinationItem}>
          <Ionicons name={destination.icon} size={24} color="#1976D2" />
          <ThemedText numberOfLines={1} style={styles.destinationText}>
            {destination.name}
          </ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Componente para mostrar viajes recientes
const RecentTrips = () => {
  const trips = [
    { origin: "Casa", destination: "Trabajo", date: "Hoy" },
    { origin: "Trabajo", destination: "Gimnasio", date: "Ayer" },
    { origin: "Casa", destination: "Centro Comercial", date: "15 Abril" }
  ];

  return (
    <View style={styles.recentTrips}>
      {trips.map((trip, index) => (
        <TouchableOpacity key={index} style={styles.tripItem}>
          <View style={styles.tripIconContainer}>
            <Ionicons name="time" size={20} color="#666" />
          </View>
          <View style={styles.tripDetails}>
            <ThemedText style={styles.tripText}>
              {trip.origin} → {trip.destination}
            </ThemedText>
            <ThemedText style={styles.tripDate}>{trip.date}</ThemedText>
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
    paddingTop: Platform.OS === 'ios' ? 4 : 12, // SafeAreaView ya proporciona margen en iOS
    paddingBottom: 12,
    backgroundColor: '#A1CEDC',
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
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
    opacity: 0.7,
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
});