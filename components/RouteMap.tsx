import React, { useEffect } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { decode } from "@mapbox/polyline";

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

interface RouteMapProps {
  mapRef: React.RefObject<MapView>;
  origin: { latitude: number; longitude: number };
  setOrigin: (origin: { latitude: number; longitude: number }) => void;
  destiny: { latitude: number; longitude: number };
  speedLimits?: SpeedLimit[];
  schoolZones?: SchoolZone[];
  activeRoutePolyline?: string;
  activeRoute?: any;
  POIs?: any[];
  onPOIPress?: (poi: any) => void;
}

const RouteMap = ({ 
  mapRef, 
  origin, 
  setOrigin, 
  destiny,
  speedLimits = [],
  schoolZones = [],
  activeRoutePolyline = '',
  activeRoute = null,
  POIs  = [] , 
  onPOIPress = () => {} 
}: RouteMapProps) => {
  
  // Verificar si hay una ruta activa o seleccionada
  const selectedRoute = activeRoute;
  
  // Función para decodificar polylines
  const decodePolyline = (encoded) => {
    if (!encoded) return [];
    try {
      return decode(encoded).map(point => ({
        latitude: point[0],
        longitude: point[1]
      }));
    } catch (error) {
      console.error('Error decoding polyline:', error);
      return [];
    }
  };
  
  // Ajustar el mapa para mostrar todos los puntos relevantes
  useEffect(() => {
    if (!mapRef.current) return;
    
    if (selectedRoute && selectedRoute.segments && selectedRoute.segments.length > 0) {
      console.log("Adjusting map for segments, count:", selectedRoute.segments.length);
      
      // Si hay segmentos, obtener todos los puntos para ajustar el mapa
      const allPoints = [];
      
      selectedRoute.segments.forEach(segment => {
        if (segment && segment.polyline) {
          const points = decodePolyline(segment.polyline);
          if (points && points.length > 0) {
            allPoints.push(...points);
          }
        }
      });
      
      if (allPoints.length > 0) {
        console.log("Fitting to coordinates with segments, points:", allPoints.length);
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
      console.log("Adjusting map for activeRoutePolyline");
      // Si hay una polyline de ruta activa pero no hay segmentos
      const points = decodePolyline(activeRoutePolyline);
      if (points.length > 0) {
        console.log("Fitting to coordinates with polyline, points:", points.length);
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
      console.log("Adjusting map for origin and destiny");
      // Si no hay ruta, mostrar origen y destino
      mapRef.current.fitToCoordinates([origin, destiny], {
        edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
        animated: true
      });
    }
  }, [selectedRoute, activeRoutePolyline, origin, destiny]);
  
  const getPOIColor = (type) => {
    const colors = {
      'restaurant': '#FF5722', // Naranja
      'cafe': '#795548', // Marrón
      'shopping_mall': '#9C27B0', // Púrpura
      'tourist_attraction': '#4CAF50', // Verde
      'museum': '#000000', // Azul
      'pharmacy': '#F44336', // Rojo
      'hospital': '#E91E63', // Rosa
      // Nuevos colores para tipos relacionados con tráfico
    'school': '#FFC107',     // Amarillo - para advertencia de zona escolar
    'police': '#3F51B5',     // Azul oscuro - para policía
    'gas_station': '#009688',// Verde azulado - para gasolineras
    'parking': '#4CAF50',    // Verde - para estacionamientos
    'bus_station': '#FF9800',// Naranja - para estaciones de bus
    'subway_station': '#673AB7', // Morado - para metro
    'transit_station': '#2196F3', // Azul - para transporte
    'taxi_stand': '#FFEB3B', // Amarillo claro - para taxis
    'car_repair': '#795548', // Marrón - para talleres
    'traffic_control_point': '#F44336' // Rojo - para puntos de control
    };
    return colors[type] || '#607D8B'; // Gris por defecto
  };
  
  const getPOIIcon = (type) => {
    const icons = {
      'restaurant': 'restaurant',
      'cafe': 'cafe',
      'shopping_mall': 'shopping',
      'tourist_attraction': 'camera',
      'museum': 'album',
      'pharmacy': 'medkit',
      'hospital': 'medical',
      'school': 'school',
      'police': 'shield',
      'gas_station': 'car',
      'parking': 'car',
      'bus_station': 'bus',
      'subway_station': 'subway',
      'transit_station': 'train',
      'taxi_stand': 'taxi',
      'car_repair': 'construct',
      'traffic_control_point': 'warning'
    };
    return icons[type] || 'location';
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
    >
      {/* Marcador de origen */}
      <Marker 
        coordinate={origin} 
        title="Ubicación"
        draggable={true}
        onDragEnd={(e) => setOrigin(e.nativeEvent.coordinate)}
        description="Esta es tu ubicación"
      >
        <View style={styles.originMarker}>
          <Text style={styles.markerText}>📍</Text>
        </View>
      </Marker>
      
      {/* Marcador de destino */}
      <Marker 
        coordinate={destiny} 
        title="Destino" 
        description="Este es tu destino"
      >
        <View style={styles.destinyMarker}>
          <Text style={styles.markerText}>🏁</Text>
        </View>
      </Marker>

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
          <View style={{ 
            backgroundColor: getPOIColor(poi.placeType), 
            padding: 5, 
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#fff"
          }}>
            <Icon name={getPOIIcon(poi.placeType)} size={14} color="#fff" />
          </View>
        </Marker>
      ))}
      
      {/* Dibujar segmentos de ruta con diferentes colores */}
      {selectedRoute && selectedRoute.segments && selectedRoute.segments.map((segment, idx) => {
        if (!segment || !segment.polyline) {
          console.log("Invalid segment at index", idx);
          return null;
        }
        
        const decodedPoints = decodePolyline(segment.polyline);
        
        if (!decodedPoints || decodedPoints.length === 0) {
          console.log("No points in segment at index", idx);
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
        
        console.log(`Drawing segment ${idx} of type ${segment.type} with ${decodedPoints.length} points and color ${color}`);
        
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
      
      {/* Mostrar paradas de autobús */}
      {selectedRoute && selectedRoute.segments && selectedRoute.segments
        .filter(segment => segment && segment.type === 'BUS' && segment.polyline)
        .map((segment, idx) => {
          const busStopPoints = decodePolyline(segment.polyline);
          
          // Solo renderizar si hay puntos
          if (!busStopPoints || busStopPoints.length === 0) return null;
          
          console.log(`Drawing bus stops for segment ${idx} with ${busStopPoints.length} points`);
          
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
                  <Text style={styles.markerText}>🚏</Text>
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
                  <Text style={styles.markerText}>🚏</Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })
      }
      
      {/* Mostrar estaciones de metro */}
      {selectedRoute && selectedRoute.segments && selectedRoute.segments
        .filter(segment => segment && segment.type === 'METRO' && segment.polyline)
        .map((segment, idx) => {
          const metroStopPoints = decodePolyline(segment.polyline);
          
          // Solo renderizar si hay puntos
          if (!metroStopPoints || metroStopPoints.length === 0) return null;
          
          console.log(`Drawing metro stops for segment ${idx} with ${metroStopPoints.length} points`);
          
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
                  <Text style={styles.markerText}>🚇</Text>
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
                  <Text style={styles.markerText}>🚇</Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })
      }
      
      {/* Si no hay ruta seleccionada, mostrar una dirección entre origen y destino */}
      {(!selectedRoute && !activeRoutePolyline) && (
        <MapViewDirections 
          origin={origin}
          destination={destiny}
          apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}
          strokeWidth={3}
          strokeColor="red"
          zIndex={1}
        />
      )}
      
      {/* Marcadores de límites de velocidad */}
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
      
      {/* Zonas escolares */}
      {schoolZones.map((zone, index) => (
        <Marker
          key={`school-${index}`}
          coordinate={zone.position}
          title={zone.title}
          description="Zona Escolar - Límite 30 km/h"
          zIndex={5}
        >
          <View style={styles.schoolZoneMarker}>
            <Text style={styles.markerText}>🏫</Text>
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
  speedLimitMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    borderWidth: 2,
    borderColor: 'red',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedLimitText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  schoolZoneMarker: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 5,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  markerText: {
    fontSize: 20,
  },
});

export default RouteMap;