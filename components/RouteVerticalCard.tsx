import React from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RouteVerticalCardProps {
  route: any;
  onPress: () => void;
  isSelected: boolean;
}

const RouteVerticalCard = ({ route, onPress, isSelected }: RouteVerticalCardProps) => {
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isSelected && styles.selectedCard
      ]} 
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Text style={styles.time}>{route.departureTime} - {route.arrivalTime}</Text>
          <Text style={styles.duration}>{route.duration}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Ionicons name="bus" size={14} color="#FFF" />
            <Text style={styles.badgeText}>{route.buses.length}</Text>
          </View>
          {route.metro && route.metro.length > 0 && (
            <View style={[styles.badge, styles.metroBadge]}>
              <Ionicons name="subway" size={14} color="#FFF" />
              <Text style={styles.badgeText}>{route.metro.length}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Ionicons name="walk" size={16} color="#4CAF50" />
          <Text style={styles.infoText}>Caminar: {route.segments.filter(s => s.type === 'WALKING').reduce((acc, curr) => acc + parseInt(curr.duration), 0)} min</Text>
        </View>
        
        <View style={styles.routeStops}>
          {route.buses.map((bus, index) => (
            <View key={`bus-${index}`} style={styles.transitItem}>
              <View style={[styles.transitIcon, { backgroundColor: bus.color || '#1976D2' }]}>
                <Text style={styles.transitIconText}>{bus.name}</Text>
              </View>
              <View style={styles.transitInfo}>
                <Text style={styles.transitStopText}>De: {bus.departureStop}</Text>
                <Text style={styles.transitStopText}>A: {bus.arrivalStop}</Text>
              </View>
            </View>
          ))}
          
          {route.metro && route.metro.map((metro, index) => (
            <View key={`metro-${index}`} style={styles.transitItem}>
              <View style={[styles.transitIcon, styles.metroIcon]}>
                <Text style={styles.transitIconText}>{metro.line}</Text>
              </View>
              <View style={styles.transitInfo}>
                <Text style={styles.transitStopText}>De: {metro.departureStop}</Text>
                <Text style={styles.transitStopText}>A: {metro.arrivalStop}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.fareText}>Tarifa: {route.fare}</Text>
          <View style={styles.distanceContainer}>
            <Ionicons name="location" size={14} color="#666" />
            <Text style={styles.distanceText}>{route.distance}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.viewMore}>
        <Text style={styles.viewMoreText}>Ver detalles</Text>
        <Ionicons name="chevron-forward" size={16} color="#1976D2" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeContainer: {
    flex: 1,
  },
  time: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 6,
  },
  metroBadge: {
    backgroundColor: '#FF5722',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  routeStops: {
    marginVertical: 8,
  },
  transitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transitIcon: {
    width: 36,
    height: 24,
    backgroundColor: '#1976D2',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metroIcon: {
    backgroundColor: '#FF5722',
  },
  transitIconText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transitInfo: {
    flex: 1,
  },
  transitStopText: {
    fontSize: 14,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  fareText: {
    fontSize: 14,
    color: '#333',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  viewMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#1976D2',
    marginRight: 4,
  },
});

export default RouteVerticalCard;