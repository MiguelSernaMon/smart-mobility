import React from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';

type Route = {
  id: string;
  destination: string;
  description: string;
};

const RECENT_ROUTES: Route[] = [
  { id: '1', destination: 'Universidad EAFIT', description: 'Cra. 49 #7 Sur - 50, Medellín' },
  { id: '2', destination: 'Parque Arví', description: 'Corregimiento de Santa Elena, Medellín' },
  { id: '3', destination: 'Centro Comercial Santafé', description: 'Cra. 43A #7 Sur - 170, Medellín' },
];

export default function RecentRoutes() {
  const renderRouteItem = ({ item }: { item: Route }) => (
    <TouchableOpacity style={styles.routeItem}>
      <View style={styles.iconContainer}>
        <IconSymbol name="clock" size={20} color="#0a7ea4" />
      </View>
      <View style={styles.routeInfo}>
        <ThemedText style={styles.destinationText}>{item.destination}</ThemedText>
        <ThemedText style={styles.descriptionText}>{item.description}</ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Rutas recientes</ThemedText>
        <TouchableOpacity>
          <ThemedText style={styles.seeAll}>Ver todas</ThemedText>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={RECENT_ROUTES}
        keyExtractor={item => item.id}
        renderItem={renderRouteItem}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    color: '#0a7ea4',
    fontSize: 14,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 126, 164, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  destinationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});