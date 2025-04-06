import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function PlanTripScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Planificar Viaje</ThemedText>
      
      <View style={styles.card}>
        <ThemedText type="subtitle">¡Esta ruta funciona correctamente!</ThemedText>
        <ThemedText>Aquí podrás planificar tus rutas de transporte.</ThemedText>
      </View>
      
      <View style={styles.infoBox}>
        <ThemedText style={styles.infoText}>
          Ruta actual: (tabs)/PlanTripScreen/index.tsx
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBox: {
    marginTop: 40,
    padding: 10,
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  infoText: {
    fontSize: 14,
  }
});