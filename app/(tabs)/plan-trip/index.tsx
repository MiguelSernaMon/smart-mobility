import React from 'react';
import { StyleSheet, View, TouchableOpacity, ImageBackground, TextInput } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import RecentRoutes from '@/components/plan-trip/RecentRoutes';
import BannerHeader from '@/components/plan-trip/BannerHeader';
export default function PlanTripScreen() {
  const handleSearch = (destination: string) => {
    // Lógica para manejar la búsqueda
    console.log('Buscando ruta hacia:', destination);
  };
  
  return (
    <ThemedView style={styles.container}>
    <BannerHeader onSearch={handleSearch} />
    <View style={styles.content}>
      <RecentRoutes />
    </View>       
    </ThemedView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  }
});