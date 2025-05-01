import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface RouteSegmentProps {
  segment: any;
  isLast: boolean;
}

const RouteSegment = ({ segment, isLast }: RouteSegmentProps) => {
  // Para segmentos de caminata
  if (segment.type === 'WALKING') {
    return (
      <View 
        style={[
          styles.segmentItem, 
          styles.walkingSegment,
          { borderLeftColor: '#4CAF50' }
        ]}
      >
        <View style={styles.segmentIconContainer}>
          <Text style={styles.segmentIcon}>🚶</Text>
        </View>
        <View style={styles.segmentInfoContainer}>
          <Text style={styles.segmentTitle}>
            {segment.isFirst ? 'Inicia caminando' : 'Camina'} {segment.distance}
          </Text>
          <Text>Duración: {segment.duration}</Text>
          <Text style={styles.walkingInstructions}>
            {segment.isLast ? 'Hacia tu destino final' : `Hacia: ${segment.toBusStop || 'la siguiente parada'}`}
          </Text>
        </View>
      </View>
    );
  }
  
  // Para segmentos de autobús
  if (segment.type === 'BUS') {
    return (
      <View 
        style={[
          styles.segmentItem, 
          styles.busSegment,
          { borderLeftColor: segment.color }
        ]}
      >
        <View style={styles.segmentIconContainer}>
          <Text style={styles.segmentIcon}>🚌</Text>
        </View>
        <View style={styles.segmentInfoContainer}>
          <Text style={styles.busName}>{segment.name || 'Bus'}</Text>
          <Text>De: {segment.departureStop}</Text>
          <Text>A: {segment.arrivalStop}</Text>
          <Text>Salida: {segment.departureTime}</Text>
          <Text>Duración: {segment.duration}</Text>
          <Text>Paradas: {segment.numStops}</Text>
        </View>
      </View>
    );
  }
  
  // Para otros tipos de transporte
  if (segment.type === 'OTHER_TRANSIT') {
    const icon = segment.vehicleType === 'SUBWAY' ? '🚇' : 
                 segment.vehicleType === 'TRAM' ? '🚊' : 
                 segment.vehicleType === 'TRAIN' ? '🚆' : '🚆';
    
    return (
      <View 
        style={[
          styles.segmentItem, 
          { borderLeftColor: segment.color }
        ]}
      >
        <View style={styles.segmentIconContainer}>
          <Text style={styles.segmentIcon}>{icon}</Text>
        </View>
        <View style={styles.segmentInfoContainer}>
          <Text style={styles.busName}>{segment.name || segment.vehicleType}</Text>
          <Text>De: {segment.departureStop}</Text>
          <Text>A: {segment.arrivalStop}</Text>
          <Text>Salida: {segment.departureTime}</Text>
          <Text>Duración: {segment.duration}</Text>
          <Text>Paradas: {segment.numStops}</Text>
        </View>
      </View>
    );
  }
  
  return null;
};

const styles = StyleSheet.create({
  segmentItem: {
    padding: 8,
    marginVertical: 4,
    borderLeftWidth: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    flexDirection: 'row',
  },
  walkingSegment: {
    backgroundColor: '#e8f5e9',
  },
  busSegment: {
    backgroundColor: '#f9f9f9',
  },
  segmentIconContainer: {
    marginRight: 8,
    justifyContent: 'center',
  },
  segmentIcon: {
    fontSize: 18,
  },
  segmentInfoContainer: {
    flex: 1,
  },
  segmentTitle: {
    fontWeight: 'bold',
    color: '#388E3C',
  },
  walkingInstructions: {
    fontStyle: 'italic',
    color: '#555',
    marginTop: 2,
  },
  busName: {
    fontWeight: 'bold',
  },
});

export default RouteSegment;