import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RouteSegment from './RouteSegment';
import { router } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { decode } from '@mapbox/polyline';

interface RouteDetailsModalProps {
  route: any;
  visible: boolean;
  onClose: () => void;
}

const RouteDetailsModal = ({ route, visible, onClose }: RouteDetailsModalProps) => {
  const mapRef = useRef(null);
  
  if (!route) return null;
  
  // Decodificar la polyline para mostrar la ruta en el mapa
  const decodedPoints = route.polyline 
    ? decode(route.polyline).map((point: number[]) => ({
        latitude: point[0],
        longitude: point[1],
      }))
    : [];
    
  // Obtener origen y destino de la ruta
  const origin = decodedPoints.length > 0 ? decodedPoints[0] : null;
  const destination = decodedPoints.length > 0 ? decodedPoints[decodedPoints.length - 1] : null;
  
  // Iniciar navegación con la ruta seleccionada
  const startNavigation = () => {
    // Cerrar el modal actual
    onClose();
    
    // Navegar a la pantalla de confirmación de ruta con la información necesaria
    router.push({
      pathname: '/(tabs)/confirm-route-screen',
      params: { 
        selectedRouteId: route.id.toString(),
        polyline: route.polyline,
        // Incluir otros detalles necesarios
        routeDetails: JSON.stringify({
          origin: origin,
          destination: destination,
          routeId: route.id,
          duration: route.duration,
          distance: route.distance,
          segments: JSON.stringify(route.segments)
        })
      }
    });
  };
  
  // Ajustar el mapa para mostrar la ruta completa
  useEffect(() => {
    if (mapRef.current && decodedPoints.length > 0) {
      // Ajustar el mapa para mostrar toda la ruta
      mapRef.current.fitToCoordinates(
        decodedPoints,
        { 
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true 
        }
      );
    }
  }, [visible]);
  
  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles de la ruta</Text>
        </View>
        
        {/* Mapa con la ruta */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: origin ? origin.latitude : 6.252565,
              longitude: origin ? origin.longitude : -75.570568,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Marcador de origen */}
            {origin && (
              <Marker
                coordinate={origin}
                pinColor="#1976D2"
                title="Origen"
              />
            )}
            
            {/* Marcador de destino */}
            {destination && (
              <Marker
                coordinate={destination}
                pinColor="#D32F2F"
                title="Destino"
              />
            )}
            
            {/* Polyline de la ruta */}
            {decodedPoints.length > 0 && (
              <Polyline
                coordinates={decodedPoints}
                strokeWidth={4}
                strokeColor="#1976D2"
              />
            )}
          </MapView>
          
          <TouchableOpacity 
            style={styles.expandMapButton}
            onPress={startNavigation}
          >
            <Ionicons name="expand" size={20} color="#FFF" />
            <Text style={styles.expandMapText}>Ver mapa completo</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={20} color="#1976D2" />
              <Text style={styles.summaryLabel}>Duración</Text>
              <Text style={styles.summaryValue}>{route.duration}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="location-outline" size={20} color="#1976D2" />
              <Text style={styles.summaryLabel}>Distancia</Text>
              <Text style={styles.summaryValue}>{route.distance}</Text>
            </View>
          </View>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="cash-outline" size={20} color="#1976D2" />
              <Text style={styles.summaryLabel}>Tarifa</Text>
              <Text style={styles.summaryValue}>{route.fare}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="swap-vertical-outline" size={20} color="#1976D2" />
              <Text style={styles.summaryLabel}>Trasbordos</Text>
              <Text style={styles.summaryValue}>
                {route.buses.length + (route.metro ? route.metro.length : 0) - 1}
              </Text>
            </View>
          </View>
          
          <View style={styles.schedule}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Salida</Text>
              <Text style={styles.scheduleTime}>{route.departureTime}</Text>
            </View>
            <View style={styles.scheduleLine}>
              <View style={styles.scheduleLineInner} />
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>Llegada</Text>
              <Text style={styles.scheduleTime}>{route.arrivalTime}</Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.segmentsContainer}>
          <Text style={styles.sectionTitle}>Instrucciones detalladas</Text>
          
          {route.segments.map((segment, index) => (
            <RouteSegment 
              key={`segment-${index}`}
              segment={segment} 
              isLast={index === route.segments.length - 1} 
            />
          ))}
          
          <View style={styles.safetyInfoContainer}>
            <Text style={styles.safetyInfoTitle}>Información importante</Text>
            <View style={styles.safetyInfo}>
              <Ionicons name="warning" size={18} color="#FF9800" />
              <Text style={styles.safetyInfoText}>
                Respeta los límites de velocidad y zonas escolares durante tu recorrido.
              </Text>
            </View>
            <View style={styles.safetyInfo}>
              <Ionicons name="shield-checkmark" size={18} color="#4CAF50" />
              <Text style={styles.safetyInfoText}>
                Mantén la distancia social y usa mascarilla en el transporte público.
              </Text>
            </View>
          </View>
          
          {/* Espacio para el botón de "ir a aplicación de navegación" */}
          <View style={{ height: 80 }} />
        </ScrollView>
        
        <View style={styles.navigationButtonContainer}>
          <TouchableOpacity 
            style={styles.navigationButton}
            onPress={startNavigation}
          >
            <Ionicons name="navigate" size={24} color="#FFF" />
            <Text style={styles.navigationButtonText}>Iniciar navegación</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: Platform.OS === 'android' ? 40 : 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  expandMapButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandMapText: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 4,
  },
  summary: {
    backgroundColor: '#FFF',
    padding: 16,
    margin: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  schedule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  scheduleItem: {
    width: 80,
    alignItems: 'center',
  },
  scheduleLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  scheduleLineInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#1976D2',
  },
  scheduleLabel: {
    fontSize: 12,
    color: '#666',
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  segmentsContainer: {
    flex: 1,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  safetyInfoContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
    borderRadius: 8,
  },
  safetyInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  safetyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  safetyInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  navigationButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  navigationButton: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default RouteDetailsModal;