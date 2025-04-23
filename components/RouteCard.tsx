import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import RouteSegment from "./RouteSegment";

interface RouteCardProps {
  route: any;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  showFullPathDetails: boolean;
  togglePathDetails: () => void;
}

const RouteCard = ({ 
  route, 
  index, 
  isSelected, 
  onSelect, 
  showFullPathDetails, 
  togglePathDetails 
}: RouteCardProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.routeCard,
        isSelected && styles.selectedRouteCard
      ]}
      onPress={onSelect}
    >
      <View style={styles.routeHeader}>
        <Text style={styles.routeTitle}>Ruta {index + 1}</Text>
        {route.departureTime && route.arrivalTime && (
          <Text style={styles.routeTime}>
            {route.departureTime} - {route.arrivalTime}
          </Text>
        )}
      </View>
      
      <View style={styles.routeSummary}>
        <Text>Duración total: {route.duration}</Text>
        <Text>Distancia total: {route.distance}</Text>
        <Text>Tarifa: {route.fare}</Text>
        <Text>Segmentos: {route.totalSegments}</Text>
      </View>
      
      <View style={styles.segmentsHeader}>
        <Text style={styles.segmentsTitle}>
          {showFullPathDetails ? 'Ruta detallada:' : 'Buses en esta ruta:'}
        </Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={togglePathDetails}
        >
          <Text style={styles.toggleButtonText}>
            {showFullPathDetails ? 'Ver resumen' : 'Ver detalle'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showFullPathDetails ? (
        // Mostrar todos los segmentos (caminata, bus, etc)
        route.segments.map((segment, segIndex) => (
          <RouteSegment 
            key={segIndex}
            segment={segment}
            isLast={segIndex === route.segments.length - 1}
          />
        ))
      ) : (
        // Mostrar solo el resumen de buses
        route.buses.map((bus, busIndex) => (
          <View 
            key={busIndex} 
            style={[
              styles.busItem, 
              { borderLeftColor: bus.color }
            ]}
          >
            <Text style={styles.busName}>{bus.name || 'Bus'}</Text>
            <Text>De: {bus.departureStop}</Text>
            <Text>A: {bus.arrivalStop}</Text>
            <Text>Salida: {bus.departureTime}</Text>
            <Text>Duración: {bus.duration}</Text>
          </View>
        ))
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  routeCard: {
    width: 280,
    margin: 10,
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedRouteCard: {
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeTime: {
    fontSize: 14,
    color: '#666',
  },
  routeSummary: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  segmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  segmentsTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleButton: {
    backgroundColor: '#f0f0f0',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  toggleButtonText: {
    fontSize: 12,
    color: '#555',
  },
  busItem: {
    padding: 8,
    marginVertical: 4,
    borderLeftWidth: 4,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  busName: {
    fontWeight: 'bold',
  },
});

export default RouteCard;