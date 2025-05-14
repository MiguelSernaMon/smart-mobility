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
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { decode } from '@mapbox/polyline';

interface RouteDetailsModalProps {
  route: any;
  visible: boolean;
  onClose: () => void;
}

const RouteDetailsModal = ({ route, visible, onClose }: RouteDetailsModalProps) => {
  const mapRef = useRef(null);
  
  if (!route) return null;

  // Función para decodificar polylines
  const decodePolyline = (encoded) => {
    if (!encoded) return [];
    return decode(encoded).map(point => ({
      latitude: point[0],
      longitude: point[1]
    }));
  };
  // Actualizar la función normalizeTransportType para considerar vehicleType
const normalizeTransportType = (type, vehicleType = null) => {
  if (!type) return 'UNKNOWN';
  
  // Si es OTHER_TRANSIT y tiene vehicleType, usar ese valor
  if (type.toUpperCase() === 'OTHER_TRANSIT' && vehicleType) {
    const upperVehicleType = vehicleType.toUpperCase();
    // Mapeo de vehicleType a nuestros tipos internos
    const vehicleTypeMapping = {
      'TRAM': 'TRANVIA',
      'SUBWAY': 'METRO',
      'TRAIN': 'METRO',
      'RAIL': 'METRO'
    };
    return vehicleTypeMapping[upperVehicleType] || upperVehicleType;
  }
  
  // Si no es OTHER_TRANSIT o no tiene vehicleType, usar el mapeo normal
  const upperType = type.toUpperCase();
  
  // Mapeo de tipos de Google a nuestros tipos internos
  const typeMapping = {
    'SUBWAY': 'METRO',
    'TRAM': 'TRANVIA',
    'CABLE_CAR': 'CABLE',
    'GONDOLA': 'CABLE',
    'RAIL': 'METRO',
    'OTHER_TRANSIT': 'TRANSIT'
  };
  
  // Si existe un mapeo, usarlo. Si no, mantener el tipo original
  return typeMapping[upperType] || upperType;
};
  
  // Decodificar la polyline general para mostrar la ruta completa
  const decodedPoints = route.polyline 
    ? decodePolyline(route.polyline)
    : [];
    
  // Obtener origen y destino de la ruta
  const origin = decodedPoints.length > 0 ? decodedPoints[0] : null;
  const destination = decodedPoints.length > 0 ? decodedPoints[decodedPoints.length - 1] : null;
   // Calcular el costo real de la ruta considerando integraciones
  const calculateRealFare = () => {
  if (!route.segments || route.segments.length === 0) {
    return route.fare || "Precio no disponible";
  }
  
  // Tarifas base según el tipo de transporte
  const baseFares = {
  TRANSIT: 3600, // Metro/transporte público general
  BUS: 2400,     // Autobús
  SUBWAY: 3600,  // Metro
  TRAM: 3600,    // Tranvía
  RAIL: 3600,    // Tren
  CABLE_CAR: 2800, // Teleférico/Cable
  GONDOLA: 2800,   // Góndola/Cable aereo
  WALKING: 0,      // Caminar
  OTHER_TRANSIT: 3600, // Otros tipos de transporte público
  // Mapeo a nuestros tipos personalizados para compatibilidad
  METRO: 3600,
  CABLE: 3600,
  TRANVIA: 3600
};
  
  // Función para normalizar el tipo de transporte
  
  
  let totalFare = 0;
  let lastTransportTime = null;
  let lastTransportType = null;
  let hasIntegration = false;
  
  try {
    // Filtramos segmentos válidos (con tipo y departureTime definidos)
    const validSegments = route.segments.filter(segment => 
      segment && segment.type && segment.departureTime);
    
    if (validSegments.length === 0) {
      console.log("No hay segmentos válidos para calcular la tarifa");
      return route.fare || "$0";
    }
    
    // Ordenamos los segmentos por tiempo de inicio
    const sortedSegments = [...validSegments].sort((a, b) => {
      const timeA = a.departureTime ? new Date(a.departureTime).getTime() : 0;
      const timeB = b.departureTime ? new Date(b.departureTime).getTime() : 0;
      return timeA - timeB;
    });
    
    // Procesamos cada segmento para calcular la tarifa
    sortedSegments.forEach((segment) => {
      // Normalizar el tipo de transporte para manejar diferentes formatos
      const transportType = normalizeTransportType(segment.type);
      
      if (transportType === 'WALKING' || transportType === 'UNKNOWN') return; // Caminar es gratis
      
      // Asegurarse de que el tipo de transporte es válido
      if (!baseFares[transportType]) {
        console.log(`Tipo de transporte desconocido: ${transportType} (original: ${segment.type})`);
        return;
      }
      
      const currentTime = segment.departureTime ? new Date(segment.departureTime).getTime() : 0;
      
      // Si hay un transporte previo
      if (lastTransportTime !== null && lastTransportType !== null) {
        const timeDiff = (currentTime - lastTransportTime) / (1000 * 60); // Diferencia en minutos
        
        // Si ha pasado menos de 60 minutos desde el último transporte y es una integración válida
        if (timeDiff <= 60 && 
            ((lastTransportType === 'METRO' && ['BUS', 'TRANVIA', 'CABLE'].includes(transportType)) || 
             (lastTransportType === 'BUS' && ['METRO', 'TRANVIA', 'CABLE'].includes(transportType)) ||
             (lastTransportType === 'TRANVIA' && ['METRO', 'BUS'].includes(transportType)) ||
             (lastTransportType === 'CABLE' && ['METRO', 'BUS'].includes(transportType)))) {
          // Aplicar descuento de integración (descuento fijo de 1000)
          totalFare += baseFares[transportType] - 1000;
          hasIntegration = true;
        } else {
          // Cobro completo
          totalFare += baseFares[transportType];
        }
      } else {
        // Primer transporte
        totalFare += baseFares[transportType];
      }
      
      // Actualizar tiempo y tipo del último transporte
      lastTransportTime = currentTime;
      lastTransportType = transportType;
    });
    
    // Verificar que la tarifa sea válida
    if (isNaN(totalFare) || totalFare < 0) {
      console.log("Error: La tarifa calculada no es válida");
      return route.fare || "$0";
    }
    
    // Formato de la tarifa con separadores de miles
    return `$${totalFare.toLocaleString('es-CO')}${hasIntegration ? ' (con integración)' : ''}`;
  } catch (error) {
    console.error("Error al calcular la tarifa:", error);
    return route.fare || "$0";
  }
};
  
 
  // Iniciar navegación con la ruta seleccionada
    const startNavigation = () => {
    // Cerrar el modal actual
    onClose();
    
    // Calcular la tarifa real con integración
    const calculatedFare = calculateRealFare();
    
    // Navegar a la pantalla de confirmación de ruta con la información necesaria
    router.push({
      pathname: '/(tabs)/confirm-route-screen',
      params: { 
        selectedRouteId: route.id.toString(),
        polyline: route.polyline,
        // Incluir todos los detalles necesarios
        routeDetails: JSON.stringify({
          origin: origin,
          destination: destination,
          routeId: route.id,
          duration: route.duration,
          distance: route.distance,
          segments: JSON.stringify(route.segments),
          buses: route.buses,
          metro: route.metro,
          fare: calculatedFare, // Usar el valor calculado
          departureTime: route.departureTime,
          arrivalTime: route.arrivalTime
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
  
  // Función para obtener color según el tipo de segmento
  const getSegmentColor = (type) => {
    switch (type) {
      case 'WALKING':
        return '#4CAF50'; // Verde para caminatas
      case 'BUS':
        return '#1976D2'; // Color específico del bus o azul por defecto
      case 'METRO':
        return '#FF5722'; // Naranja para metro
      default:
        return '#9C27B0'; // Violeta para otros transportes
    }
  };
  
  // Verificar que los segmentos tengan la información necesaria
  console.log("Route segments:", route.segments ? route.segments.length : 0);
  
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
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
        {/* Mapa con la ruta */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
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
                title="Origen"
              >
                <View style={styles.originMarker}>
                  <Text style={styles.markerText}>📍</Text>
                </View>
              </Marker>
            )}
            
            {/* Marcador de destino */}
            {destination && (
              <Marker
                coordinate={destination}
                title="Destino"
              >
                <View style={styles.destinyMarker}>
                  <Text style={styles.markerText}>🏁</Text>
                </View>
              </Marker>
            )}
            
            {/* Segmentos de ruta con colores según tipo */}
            {route.segments && route.segments.map((segment, idx) => {
              if (!segment || !segment.polyline) return null;
              
              const segmentPoints = decodePolyline(segment.polyline);
              if (segmentPoints.length === 0) return null;
              
              return (
                <Polyline
                  key={`segment-${idx}`}
                  coordinates={segmentPoints}
                  strokeWidth={5}
                  strokeColor={getSegmentColor(segment.type)}
                  zIndex={3}
                />
              );
            })}
            
            {/* Paradas de autobús */}
            {route.segments && route.segments
              .filter(segment => segment.type === 'BUS' && segment.polyline)
              .map((segment, idx) => {
                const busStopPoints = decodePolyline(segment.polyline);
                if (!busStopPoints || busStopPoints.length === 0) return null;
                
                return (
                  <React.Fragment key={`bus-stops-${idx}`}>
                    {/* Parada de salida */}
                    <Marker
                      key={`bus-start-${idx}`}
                      coordinate={busStopPoints[0]}
                      title={segment.departureStop || 'Parada de salida'}
                      description={`Bus: ${segment.name || ''}`}
                    >
                      <View style={styles.busStopMarker}>
                        <Text style={styles.markerText}>🚏</Text>
                      </View>
                    </Marker>
                    
                    {/* Parada de llegada */}
                    <Marker
                      key={`bus-end-${idx}`}
                      coordinate={busStopPoints[busStopPoints.length - 1]}
                      title={segment.arrivalStop || 'Parada de llegada'}
                      description={`Bus: ${segment.name || ''}`}
                    >
                      <View style={styles.busStopMarker}>
                        <Text style={styles.markerText}>🚏</Text>
                      </View>
                    </Marker>
                  </React.Fragment>
                );
              })
            }
            
            {/* Estaciones de metro */}
            {route.segments && route.segments
              .filter(segment => segment.type === 'METRO' && segment.polyline)
              .map((segment, idx) => {
                const metroStopPoints = decodePolyline(segment.polyline);
                if (!metroStopPoints || metroStopPoints.length === 0) return null;
                
                return (
                  <React.Fragment key={`metro-stops-${idx}`}>
                    {/* Estación de salida */}
                    <Marker
                      key={`metro-start-${idx}`}
                      coordinate={metroStopPoints[0]}
                      title={segment.departureStop || 'Estación de salida'}
                      description={`Metro Línea ${segment.line || ''}`}
                    >
                      <View style={styles.metroStopMarker}>
                        <Text style={styles.markerText}>🚇</Text>
                      </View>
                    </Marker>
                    
                    {/* Estación de llegada */}
                    <Marker
                      key={`metro-end-${idx}`}
                      coordinate={metroStopPoints[metroStopPoints.length - 1]}
                      title={segment.arrivalStop || 'Estación de llegada'}
                      description={`Metro Línea ${segment.line || ''}`}
                    >
                      <View style={styles.metroStopMarker}>
                        <Text style={styles.markerText}>🚇</Text>
                      </View>
                    </Marker>
                  </React.Fragment>
                );
              })
            }
            
            {/* Polyline de la ruta completa (como reserva si los segmentos fallan) */}
            {!route.segments && decodedPoints.length > 0 && (
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
              <Text style={styles.summaryValue}>{calculateRealFare()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="swap-vertical-outline" size={20} color="#1976D2" />
              <Text style={styles.summaryLabel}>Trasbordos</Text>
              <Text style={styles.summaryValue}>
  {(() => {
    // Contamos cuántos tipos de transporte distintos hay en los segmentos
    if (route.segments && route.segments.length > 0) {
      // Filtramos segmentos de transporte (no caminatas) usando la función normalizeTransportType
      const transportSegments = route.segments.filter(segment => {
        if (!segment || !segment.type) return false;
        
        // Normalizar el tipo usando la misma función que usamos para la tarifa
        // Consideramos vehicleType para OTHER_TRANSIT
        const normalizedType = normalizeTransportType(
          segment.type, 
          segment.type === 'OTHER_TRANSIT' && segment.vehicleType ? segment.vehicleType : null
        );
        
        return normalizedType !== 'WALKING' && normalizedType !== 'UNKNOWN';
      });
      
      // Verificamos qué tipos de transporte tenemos (para debug)
      console.log("Segmentos filtrados:", transportSegments.length);
      console.log("Tipos de transporte:", transportSegments.map(s => {
        const origType = s.type;
        const vehicleType = s.type === 'OTHER_TRANSIT' && s.vehicleType ? s.vehicleType : 'N/A';
        const normalizedType = normalizeTransportType(origType, vehicleType);
        return `${origType} (${vehicleType}) → ${normalizedType}`;
      }));
      
      // Si no hay segmentos de transporte, no hay trasbordos
      if (transportSegments.length === 0) return '0';
      
      // El número de trasbordos es el número de segmentos de transporte menos 1
      // (pero nunca menos que 0)
      const transfers = Math.max(0, transportSegments.length - 1);
      return transfers.toString();
    }
    return '0';
  })()}
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
        
        <View style={styles.segmentsContainer}>
          <Text style={styles.sectionTitle}>Instrucciones detalladas</Text>
          
          {route.segments && route.segments.map((segment, index) => (
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
        </View>
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
  scrollContainer: {
    flex: 1,
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
    height: 220,
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
    position: 'relative',
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
  originMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  destinyMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: 'red',
  },
  busStopMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  metroStopMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  markerText: {
    fontSize: 20,
  },
});

export default RouteDetailsModal;