import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RouteActiveInfoProps {
  route: any;
  onCancel: () => void;
}

const RouteActiveInfo = ({ route, onCancel }: RouteActiveInfoProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <View style={styles.routeInfo}>
          <Text style={styles.title}>Navegación activa</Text>
          <Text style={styles.subtitle}>
            {route.distance} · {route.duration}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Ionicons name="close-circle" size={24} color="#D32F2F" />
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="speedometer" size={18} color="#555" />
          <Text style={styles.infoText}>Respeta los límites de velocidad</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="school" size={18} color="#FF9800" />
          <Text style={styles.infoText}>Zonas escolares: 30 km/h</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  cancelText: {
    color: '#D32F2F',
    marginLeft: 4,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 4,
  },
});

export default RouteActiveInfo;