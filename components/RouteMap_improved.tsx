import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Circle } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { decode } from "@mapbox/polyline";
import { Ionicons } from '@expo/vector-icons';

// Interfaces TypeScript
interface SpeedLimit {
  id: string;
  position: {
    latitude: number;
    longitude: number;
  };
  value: string;
  unit: string;
}

interface SchoolZone {
  id: string;
  position: {
    latitude: number;
    longitude: number;
  };
  title: string;
}

interface AudioPoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  radius: number;
  audioText: string;
  triggered: boolean;
}

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  category: 'accessibility' | 'safety' | 'infrastructure' | 'transport' | 'other';
  imageUri?: string;
  userId: string;
  userName: string;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'resolved';
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Segment {
  type: string;
  polyline: string;
  name?: string;
  color?: string;
  departureStop?: string;
  arrivalStop?: string;
  line?: string;
}

interface RouteMapProps {
  mapRef: React.RefObject<MapView>;
  origin: Coordinates;
  destiny: Coordinates;
  selectedRoute: {
    segments?: Segment[];
  } | null;
  activeRoutePolyline: string;
  setOrigin: (coords: Coordinates) => void;
  POIs: any[];
  speedLimits: SpeedLimit[];
  schoolZones: SchoolZone[];
  audioPoints?: AudioPoint[];
  reports?: Report[];
  onMapPress: (coordinate: Coordinates) => void;
  onPOIPress: (poi: any) => void;
  onAudioPointPress?: (point: AudioPoint) => void;
  onReportPress?: (report: Report) => void;
}

const RouteMap: React.FC<RouteMapProps> = ({
  mapRef,
  origin,
  destiny,
  selectedRoute,
  activeRoutePolyline,
  setOrigin,
  POIs,
  speedLimits,
  schoolZones,
  audioPoints = [],
  reports = [],
  onMapPress,
  onPOIPress,
  onAudioPointPress,
  onReportPress,
}) => {
  
  // Función para decodificar polylines
  const decodePolyline = (encoded: string): Coordinates[] => {
    if (!encoded) return [];
    try {
      return decode(encoded).map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng,
      }));
    } catch (error) {
      return [];
    }
  };

  // Efecto para ajustar el mapa basado en la ruta seleccionada
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (selectedRoute && selectedRoute.segments && selectedRoute.segments.length > 0) {
      // Si hay segmentos, obtener todos los puntos para ajustar el mapa
      const allPoints: Coordinates[] = [];
      
      selectedRoute.segments.forEach((segment: Segment) => {
        if (segment && segment.polyline) {
          const points = decodePolyline(segment.polyline);
          if (points && points.length > 0) {
            allPoints.push(...points);
          }
        }
      });
      
      if (allPoints.length > 0) {
        mapRef.current.fitToCoordinates(allPoints, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true
        });
      } else {
        // Si los segmentos no tienen puntos válidos, ajustar a origen y destino
        mapRef.current.fitToCoordinates([origin, destiny], {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true
        });
      }
    } else if (activeRoutePolyline) {
      // Si hay una polyline de ruta activa pero no hay segmentos
      const points = decodePolyline(activeRoutePolyline);
      if (points.length > 0) {
        mapRef.current.fitToCoordinates(points, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true
        });
      } else {
        // Si la polyline no tiene puntos válidos, ajustar a origen y destino
        mapRef.current.fitToCoordinates([origin, destiny], {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true
        });
      }
    } else {
      // Si no hay ruta, mostrar origen y destino
      mapRef.current.fitToCoordinates([origin, destiny], {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true
      });
    }
  }, [selectedRoute, activeRoutePolyline, origin, destiny]);
  
  // Funciones para obtener colores e iconos mejorados de POIs
  const getPOIColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'restaurant': '#FF6B35',    // Naranja vibrante
      'cafe': '#8B4513',          // Marrón café
      'shopping_mall': '#9C27B0', // Púrpura
      'tourist_attraction': '#4CAF50', // Verde
      'museum': '#3F51B5',        // Azul índigo
      'pharmacy': '#F44336',      // Rojo
      'hospital': '#E91E63',      // Rosa médico
      'school': '#FFC107',        // Amarillo advertencia
      'police': '#1976D2',        // Azul policía
      'gas_station': '#009688',   // Verde azulado
      'parking': '#4CAF50',       // Verde
      'bus_station': '#FF9800',   // Naranja transporte
      'subway_station': '#673AB7', // Morado metro
      'transit_station': '#2196F3', // Azul transporte
      'taxi_stand': '#FFEB3B',    // Amarillo taxi
      'car_repair': '#795548',    // Marrón taller
      'traffic_control_point': '#F44336' // Rojo control
    };
    return colors[type] || '#607D8B';
  };
  
  const getPOIIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'restaurant': 'restaurant',
      'cafe': 'cafe',
      'shopping_mall': 'storefront',
      'tourist_attraction': 'camera',
      'museum': 'library',
      'pharmacy': 'medical',
      'hospital': 'medical',
      'school': 'school',
      'police': 'shield-checkmark',
      'gas_station': 'car-sport',
      'parking': 'car',
      'bus_station': 'bus',
      'subway_station': 'train',
      'transit_station': 'train',
      'taxi_stand': 'car',
      'car_repair': 'construct',
      'traffic_control_point': 'warning'
    };
    return icons[type] || 'location';
  };

  // Funciones para los reportes con iconos mejorados
  const getReportIcon = (category: Report['category']): string => {
    const icons: { [key: string]: string } = {
      'accessibility': 'accessibility',
      'safety': 'shield-half',
      'infrastructure': 'hammer',
      'transport': 'bus',
      'other': 'help-circle'
    };
    return icons[category] || 'help-circle';
  };

  const getReportColor = (category: Report['category']): string => {
    const colors: { [key: string]: string } = {
      'accessibility': '#FF6B35',  // Naranja accesibilidad
      'safety': '#FF3B30',         // Rojo seguridad
      'infrastructure': '#FF9500', // Naranja infraestructura
      'transport': '#007AFF',      // Azul transporte
      'other': '#8E8E93'          // Gris otros
    };
    return colors[category] || '#8E8E93';
  };

  return (
    <MapView 
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={{
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      onPress={(event) => {
        const { coordinate } = event.nativeEvent;
        onMapPress(coordinate);
      }}
    >
      {/* Marcador de origen mejorado */}
      <Marker 
        coordinate={origin} 
        title="Mi Ubicación"
        draggable={true}
        onDragEnd={(e) => setOrigin(e.nativeEvent.coordinate)}
        description="Tu ubicación actual"
      >
        <View style={styles.originMarker}>
          <Ionicons name="person-circle" size={24} color="white" />
        </View>
      </Marker>
      
      {/* Marcador de destino mejorado */}
      <Marker
        coordinate={destiny}
        title="Destino"
        description="Tu destino seleccionado"
      >
        <View style={styles.destinyMarker}>
          <Ionicons name="flag" size={20} color="white" />
        </View>
      </Marker>

      {/* Marcadores de POIs mejorados */}
      {POIs.map((poi, index) => (
        <Marker
          key={`poi-${poi.place_id}-${index}`}
          coordinate={{
            latitude: poi.geometry.location.lat,
            longitude: poi.geometry.location.lng
          }}
          title={poi.name}
          description={poi.vicinity}
          onCalloutPress={() => onPOIPress(poi)}
        >
          <View style={[styles.poiMarker, { backgroundColor: getPOIColor(poi.placeType) }]}>
            <Ionicons name={getPOIIcon(poi.placeType) as any} size={16} color="white" />
          </View>
        </Marker>
      ))}
      
      {/* Dibujar segmentos de ruta con diferentes colores */}
      {selectedRoute && selectedRoute.segments && selectedRoute.segments.map((segment: Segment, idx: number) => {
        if (!segment || !segment.polyline) {
          return null;
        }
        
        const decodedPoints = decodePolyline(segment.polyline);
        
        if (!decodedPoints || decodedPoints.length === 0) {
          return null;
        }
        
        let color;
        
        if (segment.type === 'WALKING') {
          color = '#4CAF50'; // Verde para caminatas
        } else if (segment.type === 'BUS') {
          color = segment.color || '#1976D2'; // Color específico del bus o azul por defecto
        } else if (segment.type === 'METRO') {
          color = '#FF5722'; // Naranja para metro
        } else {
          color = segment.color || '#FF9800'; // Color para otros transportes o naranja por defecto
        }
        
        return (
          <Polyline
            key={`segment-${idx}`}
            coordinates={decodedPoints}
            strokeWidth={5}
            strokeColor={color}
            zIndex={3}
          />
        );
      })}
      
      {/* Si no hay segmentos pero hay una polyline, mostrarla */}
      {(!selectedRoute || !selectedRoute.segments || selectedRoute.segments.length === 0) && activeRoutePolyline && (
        <Polyline
          coordinates={decodePolyline(activeRoutePolyline)}
          strokeWidth={4}
          strokeColor="#1976D2"
          zIndex={2}
        />
      )}
      
      {/* Mostrar paradas de autobús mejoradas */}
      {selectedRoute && selectedRoute.segments && selectedRoute.segments
        .filter((segment: Segment) => segment && segment.type === 'BUS' && segment.polyline)
        .map((segment: Segment, idx: number) => {
          const busStopPoints = decodePolyline(segment.polyline);
          
          // Solo renderizar si hay puntos
          if (!busStopPoints || busStopPoints.length === 0) return null;
          
          return (
            <React.Fragment key={`bus-stops-${idx}`}>
              {/* Parada de salida */}
              <Marker
                key={`busstop-start-${idx}`}
                coordinate={busStopPoints[0]}
                title={`Parada: ${segment.departureStop || 'Salida'}`}
                description={`Bus: ${segment.name || ''}`}
                zIndex={4}
              >
                <View style={styles.busStopMarker}>
                  <Ionicons name="bus" size={16} color="#1976D2" />
                </View>
              </Marker>
              
              {/* Parada de llegada */}
              <Marker
                key={`busstop-end-${idx}`}
                coordinate={busStopPoints[busStopPoints.length - 1]}
                title={`Parada: ${segment.arrivalStop || 'Llegada'}`}
                description={`Bus: ${segment.name || ''}`}
                zIndex={4}
              >
                <View style={styles.busStopMarker}>
                  <Ionicons name="bus" size={16} color="#1976D2" />
                </View>
              </Marker>
            </React.Fragment>
          );
        })
      }
      
      {/* Mostrar estaciones de metro mejoradas */}
      {selectedRoute && selectedRoute.segments && selectedRoute.segments
        .filter((segment: Segment) => segment && segment.type === 'METRO' && segment.polyline)
        .map((segment: Segment, idx: number) => {
          const metroStopPoints = decodePolyline(segment.polyline);
          
          // Solo renderizar si hay puntos
          if (!metroStopPoints || metroStopPoints.length === 0) return null;
          
          return (
            <React.Fragment key={`metro-stops-${idx}`}>
              {/* Estación de salida */}
              <Marker
                key={`metrostop-start-${idx}`}
                coordinate={metroStopPoints[0]}
                title={`Estación: ${segment.departureStop || 'Salida'}`}
                description={`Metro Línea ${segment.line || ''}`}
                zIndex={4}
              >
                <View style={styles.metroStopMarker}>
                  <Ionicons name="train" size={16} color="#FF5722" />
                </View>
              </Marker>
              
              {/* Estación de llegada */}
              <Marker
                key={`metrostop-end-${idx}`}
                coordinate={metroStopPoints[metroStopPoints.length - 1]}
                title={`Estación: ${segment.arrivalStop || 'Llegada'}`}
                description={`Metro Línea ${segment.line || ''}`}
                zIndex={4}
              >
                <View style={styles.metroStopMarker}>
                  <Ionicons name="train" size={16} color="#FF5722" />
                </View>
              </Marker>
            </React.Fragment>
          );
        })
      }
      
      {/* Si no hay ruta seleccionada, mostrar una dirección entre origen y destino */}
      {(!selectedRoute && !activeRoutePolyline) && process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY && (
        <MapViewDirections 
          origin={origin}
          destination={destiny}
          apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}
          strokeWidth={3}
          strokeColor="#1976D2"
        />
      )}
      
      {/* Marcadores de límites de velocidad mejorados */}
      {speedLimits.map((limit, index) => (
        <Marker
          key={`speed-${index}`}
          coordinate={limit.position}
          title={`Límite: ${limit.value} ${limit.unit}`}
          zIndex={5}
        >
          <View style={styles.speedLimitMarker}>
            <Text style={styles.speedLimitText}>{limit.value}</Text>
          </View>
        </Marker>
      ))}
      
      {/* Zonas escolares mejoradas */}
      {schoolZones.map((zone, index) => (
        <Marker
          key={`school-${index}`}
          coordinate={zone.position}
          title={zone.title}
          description="Zona Escolar - Límite 30 km/h"
          zIndex={5}
        >
          <View style={styles.schoolZoneMarker}>
            <Ionicons name="school" size={16} color="#FF9800" />
          </View>
        </Marker>
      ))}

      {/* Marcadores de puntos de audio para accesibilidad mejorados */}
      {audioPoints && audioPoints.map((point) => (
        <Marker
          key={`audio-point-${point.id}`}
          coordinate={{
            latitude: point.latitude,
            longitude: point.longitude
          }}
          title={point.title}
          description={point.description}
          onPress={() => onAudioPointPress && onAudioPointPress(point)}
        >
          <View style={styles.audioPointMarker}>
            <Ionicons name="volume-high" size={18} color="white" />
          </View>
        </Marker>
      ))}

      {/* Círculo de proximidad para puntos de audio */}
      {audioPoints && audioPoints.map((point) => (
        <Circle
          key={`audio-circle-${point.id}`}
          center={{
            latitude: point.latitude,
            longitude: point.longitude
          }}
          radius={point.radius}
          strokeColor="rgba(255, 107, 53, 0.3)"
          fillColor="rgba(255, 107, 53, 0.1)"
          strokeWidth={2}
        />
      ))}

      {/* Marcadores de reportes mejorados */}
      {reports && reports.length > 0 && reports.map((report) => (
        <Marker
          key={`report-marker-${report.id}-${report.timestamp}`}
          coordinate={{
            latitude: parseFloat(report.latitude.toString()),
            longitude: parseFloat(report.longitude.toString())
          }}
          title={report.title}
          description={`${report.category} - ${report.description}`}
          onPress={() => {
            onReportPress && onReportPress(report);
          }}
        >
          <View style={[styles.reportMarker, { backgroundColor: getReportColor(report.category) }]}>
            <Ionicons name={getReportIcon(report.category) as any} size={16} color="white" />
          </View>
        </Marker>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  originMarker: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  destinyMarker: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  audioPointMarker: {
    backgroundColor: '#FF6B35',
    padding: 10,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 10,
  },
  reportMarker: {
    padding: 10,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 10,
  },
  poiMarker: {
    padding: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 6,
  },
  trainMarker: {
    backgroundColor: '#FF9800',
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  stationMarker: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  busStopMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#1976D2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  metroStopMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FF5722',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  speedLimitMarker: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 6,
    borderWidth: 3,
    borderColor: '#F44336',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 6,
  },
  speedLimitText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#F44336',
  },
  schoolZoneMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FF9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  markerText: {
    fontSize: 16,
  },
});

export default RouteMap;
