import React, { useState, useEffect } from 'react';
import { StyleSheet, Image, Platform, View, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import RouteVerticalCard from '@/components/RouteVerticalCard';
import RouteDetailsModal from '@/components/RouteDetailsModal';
import { StatusBar } from 'react-native';

export default function ExploreScreen() {
  const params = useLocalSearchParams();
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusBarHeight, setStatusBarHeight] = useState(0);
      useEffect(() => {
        setStatusBarHeight(StatusBar.currentHeight || 0);
      }, []);

  useEffect(() => {
    if (params.routes) {
      try {
        const parsedRoutes = JSON.parse(params.routes);
        setRoutes(parsedRoutes);
      } catch (error) {
        console.error('Error parsing routes:', error);
      }
    }
  }, [params.routes]);

  const handleRoutePress = (route) => {
    setSelectedRoute(route);
    setShowDetails(true);
  };

  const renderEmptyContent = () => (
    <>
      
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Rutas de Transporte</ThemedText>
      </ThemedView>
      <ThemedText>No hay rutas disponibles. Busca un destino para ver rutas.</ThemedText>
      <Collapsible title="Opciones de transporte">
        <ThemedText>
          Puedes buscar rutas de transporte público que incluyen autobuses y metro.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Información de tráfico">
        <ThemedText>
          Consulta información actualizada sobre el tráfico y las condiciones de las vías.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Zonas escolares">
        <ThemedText>
          Ten precaución en zonas escolares donde el límite de velocidad es de 30 km/h.
        </ThemedText>
      </Collapsible>
    </>
  );

  if (routes.length === 0) {
    return (
      <>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <SafeAreaView style={styles.safeArea}>
          {/* Añade un espacio para la barra de estado en Android */}
          {Platform.OS === 'android' && (
            <View style={{ height: statusBarHeight }} />
          )}
          
          <ParallaxScrollView
            headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
            headerImage={
              <Image
                source={require('@/assets/images/hero3.png')}
                style={styles.headerImage}
                resizeMode="cover"
              />
            }>
            {renderEmptyContent()}
          </ParallaxScrollView>
        </SafeAreaView>
      </>
    );
  }
  
  // Si hay rutas disponibles, mostrarlas en formato vertical
  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        {/* Añade un espacio para la barra de estado en Android */}
        {Platform.OS === 'android' && (
          <View style={{ height: statusBarHeight }} />
        )}
        
        <View style={styles.header}>
          <ThemedText type="title">Rutas disponibles</ThemedText>
          <ThemedText>{routes.length} opciones encontradas</ThemedText>
        </View>
        
        <FlatList
          data={routes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <RouteVerticalCard
              route={item}
              onPress={() => handleRoutePress(item)}
              isSelected={selectedRoute && selectedRoute.id === item.id}
            />
          )}
          contentContainerStyle={styles.routesList}
        />
        
        {showDetails && selectedRoute && (
          <RouteDetailsModal
            route={selectedRoute}
            visible={showDetails}
            onClose={() => setShowDetails(false)}
          />
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'ios' ? 40 : 60,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  routesList: {
    padding: 12,
  },
  headerImage: {
    width: '100%',
    height: '100%'
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});