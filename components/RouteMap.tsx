import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { decodePolyline } from "@/utils/polylineDecoder";

interface RouteMapProps {
  mapRef: React.RefObject<MapView>;
  origin: { latitude: number; longitude: number };
  setOrigin: (origin: { latitude: number; longitude: number }) => void;
  destiny: { latitude: number; longitude: number };
  selectedRoute: any;
}

const RouteMap = ({ mapRef, origin, setOrigin, destiny, selectedRoute }: RouteMapProps) => {
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
      
      <Marker coordinate={destiny} title="Destino" description="Este es tu destino">
        <View style={styles.destinyMarker}>
          <Text style={styles.markerText}>🏁</Text>
        </View>
      </Marker>
      
      {selectedRoute && selectedRoute.segments.map((segment, idx) => {
        const decodedPoints = decodePolyline(segment.polyline);
        let color;
        
        if (segment.type === 'WALKING') {
          color = '#4CAF50'; // Verde para caminatas
        } else if (segment.type === 'BUS') {
          color = segment.color || '#1976D2'; // Color específico del bus o azul por defecto
        } else {
          color = segment.color || '#FF9800'; // Color para otros transportes o naranja por defecto
        }
        
        return (
          <Polyline
            key={idx}
            coordinates={decodedPoints}
            strokeWidth={5}
            strokeColor={color}
          />
        );
      })}
      
      {/* Añadir marcadores para las paradas de autobús */}
      {selectedRoute && selectedRoute.segments
        .filter(segment => segment.type === 'BUS' || segment.type === 'OTHER_TRANSIT')
        .map((segment, idx) => {
          // Punto de partida del autobús
          const busStopPoints = decodePolyline(segment.polyline);
          if (busStopPoints.length > 0) {
            return (
              <Marker
                key={`busstop-${idx}`}
                coordinate={busStopPoints[0]}
                title={`Parada: ${segment.departureStop}`}
                description={`${segment.type === 'BUS' ? 'Bus' : 'Transporte'}: ${segment.name}`}
              >
                <View style={styles.busStopMarker}>
                  <Text style={styles.markerText}>🚏</Text>
                </View>
              </Marker>
            );
          }
          return null;
        })
      }
      
      {!selectedRoute && (
        <MapViewDirections 
          origin={origin}
          destination={destiny}
          apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}
          strokeWidth={3}
          strokeColor="red"
        />
      )}
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
    borderColor: '#FFA000',
  },
  markerText: {
    fontSize: 20,
  },
});

export default RouteMap;