import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RouteSegment from './RouteSegment';

interface RouteDetailsModalProps {
  route: any;
  visible: boolean;
  onClose: () => void;
}

const RouteDetailsModal = ({ route, visible, onClose }: RouteDetailsModalProps) => {
  if (!route) return null;
  
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
          <TouchableOpacity style={styles.navigationButton}>
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