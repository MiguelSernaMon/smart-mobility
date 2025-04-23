import React from "react";
import { StyleSheet, ScrollView } from "react-native";
import RouteCard from "./RouteCard";

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
  return (
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
          onSelect={() => setSelectedRoute(route)}
          showFullPathDetails={showFullPathDetails}
          togglePathDetails={togglePathDetails}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  routesScroll: {
    maxHeight: 280,
    backgroundColor: '#f5f5f5',
  },
});

export default RoutesList;