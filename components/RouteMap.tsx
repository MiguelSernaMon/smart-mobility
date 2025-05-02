import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, Callout, Circle } from 'react-native-maps';
import { decode } from '@mapbox/polyline';

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
  origin: {
    latitude: number;
    longitude: number;
  };
  setOrigin: (location: { latitude: number; longitude: number }) => void;
  destiny: {
    latitude: number;
    longitude: number;
  };
  selectedRoute?: any;
  speedLimits?: SpeedLimit[];
  schoolZones?: SchoolZone[];
  activeRoutePolyline?: string;
}

const RouteMap: React.FC<RouteMapProps> = ({ 
  mapRef, 
  origin, 
  setOrigin, 
  destiny, 
  selectedRoute,
  speedLimits = [],
  schoolZones = [],
  activeRoutePolyline
}) => {
  // Decodificar la polyline de la ruta seleccionada o activa
  const polylineToUse = activeRoutePolyline || (selectedRoute?.polyline || '');
  
  const decodedPoints = polylineToUse 
    ? decode(polylineToUse).map((point: number[]) => ({
        latitude: point[0],
        longitude: point[1],
      }))
    : [];

  // Ajustar el mapa cuando hay una ruta activa
  useEffect(() => {
    if (mapRef.current && decodedPoints.length > 0) {
      mapRef.current.fitToCoordinates(
        decodedPoints,
        { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
      );
    }
  }, [activeRoutePolyline, selectedRoute]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={{
        latitude: origin.latitude,
        longitude: origin.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {/* Marcador de origen */}
      <Marker
        coordinate={origin}
        draggable
        onDragEnd={(e) => setOrigin(e.nativeEvent.coordinate)}
        pinColor="#1976D2"
        title="Origen"
      />
      
      {/* Marcador de destino */}
      <Marker
        coordinate={destiny}
        pinColor="#D32F2F"
        title="Destino"
      />
      
      {/* Polyline de la ruta */}
      {decodedPoints.length > 0 && (
        <Polyline
          coordinates={decodedPoints}
          strokeWidth={4}
          strokeColor="#1976D2"
        />
      )}

      {/* Marcadores de límites de velocidad */}
      {speedLimits.map((limit, index) => (
        <Marker
          key={`speed-${index}`}
          coordinate={limit.position}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.speedLimitMarker}>
            <Text style={styles.speedLimitText}>{limit.value}</Text>
          </View>
          <Callout>
            <Text>Límite: {limit.value} {limit.unit}</Text>
          </Callout>
        </Marker>
      ))}
      
      {/* Zonas escolares */}
      {schoolZones.map((zone) => (
        <React.Fragment key={`school-${zone.id}`}>
          <Circle
            center={zone.position}
            radius={200} // Radio de 200m alrededor de la escuela
            fillColor="rgba(255,165,0,0.2)" // Naranja semi-transparente
            strokeColor="rgba(255,165,0,0.5)"
            strokeWidth={1}
          />
          <Marker
            coordinate={zone.position}
            pinColor="orange"
          >
            <Callout>
              <Text>{zone.title}</Text>
              <Text>Zona Escolar - Precaución</Text>
              <Text>Límite: 30 km/h</Text>
            </Callout>
          </Marker>
        </React.Fragment>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
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
    fontSize: 12,
  },
});

export default RouteMap;