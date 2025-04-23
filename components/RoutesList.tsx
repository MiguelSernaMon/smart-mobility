import React, { useState } from "react";
import { StyleSheet, ScrollView, View, Modal, TouchableOpacity, Dimensions, SafeAreaView } from "react-native";
import RouteCard from "./RouteCard";
import { ThemedText } from "@/components/ThemedText";
import RouteSegment from "./RouteSegment";
import { IconSymbol } from "@/components/ui/IconSymbol";

interface RoutesListProps {
  busRoutes: any[];
  selectedRoute: any;
  setSelectedRoute: (route: any) => void;
  showFullPathDetails: boolean;
  togglePathDetails: () => void;
}

const RoutesList = ({ 
  busRoutes, 
  selectedRoute, 
  setSelectedRoute, 
  showFullPathDetails, 
  togglePathDetails 
}: RoutesListProps) => {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [routeToShow, setRouteToShow] = useState(null);

  const openRouteDetail = (route) => {
    setRouteToShow(route);
    setDetailModalVisible(true);
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
        style={styles.routesScroll}
      >
        {busRoutes.map((route, index) => (
          <RouteCard
            key={route.id}
            route={route}
            index={index}
            isSelected={selectedRoute?.id === route.id}
            onSelect={() => {
              setSelectedRoute(route);
              openRouteDetail(route);
            }}
            showFullPathDetails={showFullPathDetails}
            togglePathDetails={togglePathDetails}
          />
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setDetailModalVisible(false)}
            >
              <IconSymbol name="chevron.left" size={24} color="#333" />
            </TouchableOpacity>
            <ThemedText style={styles.modalTitle}>
              Detalles de la Ruta {routeToShow?.id !== undefined ? routeToShow?.id + 1 : ''}
            </ThemedText>
          </View>

          <View style={styles.routeSummary}>
            <ThemedText style={styles.summaryTitle}>Resumen</ThemedText>
            {routeToShow && (
              <>
                <ThemedText>Duración total: {routeToShow.duration}</ThemedText>
                <ThemedText>Distancia total: {routeToShow.distance}</ThemedText>
                <ThemedText>Tarifa: {routeToShow.fare}</ThemedText>
                <ThemedText>
                  Hora: {routeToShow.departureTime} - {routeToShow.arrivalTime}
                </ThemedText>
              </>
            )}
          </View>

          <ScrollView style={styles.detailScrollView}>
            <View style={styles.segmentsContainer}>
              <ThemedText style={styles.sectionTitle}>Instrucciones detalladas</ThemedText>
              {routeToShow?.segments?.map((segment, index) => (
                <RouteSegment
                  key={index}
                  segment={segment}
                  isLast={index === routeToShow.segments.length - 1}
                />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  routesScroll: {
    maxHeight: height * 0.3, // Altura proporcional a la pantalla (30%)
    backgroundColor: '#f5f5f5',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  routeSummary: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailScrollView: {
    flex: 1,
  },
  segmentsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976D2',
  }
});

export default RoutesList;