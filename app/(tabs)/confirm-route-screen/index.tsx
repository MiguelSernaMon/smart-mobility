import React, { useState, useEffect } from "react";
import * as Location from "expo-location";
import { StyleSheet, View, Alert } from "react-native";

import Header from "@/components/Header";
import RoutesList from "@/components/RoutesList";
import RouteMap from "@/components/RouteMap";
import NoRoutesMessage from "@/components/NoRoutesMessage";

export default function ConfirmRouteScreen() {
  const mapRef = React.useRef(null);

  const [origin, setOrigin] = useState({
    latitude: 6.252565,
    longitude: -75.570568,
  });

  const [destiny, setDestiny] = useState({
    latitude: 6.296242626909633, 
    longitude: -75.57194844226433
  });

  const [busRoutes, setBusRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showFullPathDetails, setShowFullPathDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const searchDestination = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Por favor ingresa una dirección de destino");
      return;
    }
  
    setSearchLoading(true);
    try {
      const searchWithContext = `${searchQuery}, Medellín, Colombia`;
      console.log("Buscando:", searchWithContext);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchWithContext)}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}`
      );
      
      const data = await response.json();
      console.log("Estado de la respuesta:", data.status);
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const newDestiny = {
          latitude: location.lat,
          longitude: location.lng
        };
        
        setDestiny(newDestiny);
        setSearchQuery("");
        
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [origin, newDestiny],
            { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
          );
        }
        
        Alert.alert(
          "Destino establecido",
          `Destino: ${data.results[0].formatted_address}`,
          [
            { text: "Buscar rutas", onPress: fetchBusRoutes },
            { text: "OK" }
          ]
        );
      } else {
        console.warn("Error en geocodificación:", data);
        Alert.alert(
          "Error en la búsqueda",
          `No se pudo encontrar "${searchQuery}". Por favor intenta con otra dirección o sé más específico.${data.status !== 'OK' ? ` (Error: ${data.status})` : ''}`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error al buscar dirección:', error);
      Alert.alert(
        "Error",
        "Ocurrió un error al buscar la dirección. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setSearchLoading(false);
    }
  };

  async function getLocationPermission() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      alert("Permiso de ubicación denegado");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setOrigin({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  }

  const fetchBusRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destiny.latitude},${destiny.longitude}&mode=transit&transit_mode=bus&alternatives=true&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const processedRoutes = data.routes.map((route, index) => {
          // Extraer todos los pasos (steps) de la ruta
          const allSteps = route.legs[0].steps;
          
          // Procesar todos los segmentos (caminata, bus, etc.)
          const routeSegments = allSteps.map((step, stepIndex) => {
            if (step.travel_mode === 'WALKING') {
              // Determinar si esta caminata es hacia una parada de bus
              const nextBusStepIndex = allSteps.findIndex((s, idx) => 
                idx > stepIndex && 
                s.travel_mode === 'TRANSIT' && 
                s.transit_details?.line?.vehicle?.type === 'BUS'
              );
              
              let toBusStop = '';
              if (nextBusStepIndex !== -1) {
                toBusStop = allSteps[nextBusStepIndex].transit_details?.departure_stop?.name || '';
              }
              
              return {
                type: 'WALKING',
                duration: step.duration.text,
                distance: step.distance.text,
                instructions: step.html_instructions,
                polyline: step.polyline.points,
                startLocation: step.start_location,
                endLocation: step.end_location,
                toBusStop: toBusStop,
                isFirst: stepIndex === 0,
                isLast: stepIndex === allSteps.length - 1
              };
            } 
            else if (step.travel_mode === 'TRANSIT' && step.transit_details?.line?.vehicle?.type === 'BUS') {
              return {
                type: 'BUS',
                name: step.transit_details?.line?.short_name || step.transit_details?.line?.name || 'Bus',
                departureStop: step.transit_details?.departure_stop?.name,
                arrivalStop: step.transit_details?.arrival_stop?.name,
                departureTime: step.transit_details?.departure_time?.text,
                arrivalTime: step.transit_details?.arrival_time?.text,
                numStops: step.transit_details?.num_stops,
                color: step.transit_details?.line?.color || '#1976D2',
                duration: step.duration?.text,
                polyline: step.polyline.points,
                startLocation: step.start_location,
                endLocation: step.end_location
              };
            }
            else if (step.travel_mode === 'TRANSIT') {
              // Otro tipo de transporte (metro, tren, etc.)
              return {
                type: 'OTHER_TRANSIT',
                name: step.transit_details?.line?.short_name || step.transit_details?.line?.name || 'Transporte',
                vehicleType: step.transit_details?.line?.vehicle?.type || 'Transporte público',
                departureStop: step.transit_details?.departure_stop?.name,
                arrivalStop: step.transit_details?.arrival_stop?.name,
                departureTime: step.transit_details?.departure_time?.text,
                arrivalTime: step.transit_details?.arrival_time?.text,
                numStops: step.transit_details?.num_stops,
                color: step.transit_details?.line?.color || '#FF9800',
                duration: step.duration?.text,
                polyline: step.polyline.points
              };
            }
            return null;
          }).filter(Boolean);
          
          // Obtener información específica de autobuses para la vista de resumen
          const busSteps = allSteps.filter(step => 
            step.travel_mode === 'TRANSIT' && 
            step.transit_details?.line?.vehicle?.type === 'BUS'
          );
          
          const buses = busSteps.map(step => ({
            name: step.transit_details?.line?.short_name || step.transit_details?.line?.name || 'Bus',
            departureStop: step.transit_details?.departure_stop?.name,
            arrivalStop: step.transit_details?.arrival_stop?.name,
            departureTime: step.transit_details?.departure_time?.text,
            arrivalTime: step.transit_details?.arrival_time?.text,
            numStops: step.transit_details?.num_stops,
            color: step.transit_details?.line?.color || '#1976D2',
            duration: step.duration?.text
          }));
          
          return {
            id: index,
            duration: route.legs[0].duration.text,
            distance: route.legs[0].distance.text,
            buses: buses,
            segments: routeSegments,
            polyline: route.overview_polyline.points,
            fare: route.fare?.text || 'Información no disponible',
            departureTime: route.legs[0].departure_time?.text,
            arrivalTime: route.legs[0].arrival_time?.text,
            totalSegments: routeSegments.length
          };
        });
        
        setBusRoutes(processedRoutes);
        console.log('Rutas procesadas:', JSON.stringify(processedRoutes, null, 2));
        
        if (processedRoutes.length > 0) {
          setSelectedRoute(processedRoutes[0]);
        }
      } else {
        console.warn('No se encontraron rutas de autobús');
        Alert.alert(
          "No se encontraron rutas",
          `No hay rutas de autobús disponibles para este trayecto. Estado: ${data.status}`,
          [{ text: "OK" }]
        );
        setBusRoutes([]);
      }
    } catch (error) {
      console.error('Error al obtener rutas de autobús:', error);
      Alert.alert(
        "Error",
        "No se pudieron obtener las rutas de autobús. Por favor, inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocationPermission();
  }, []);

  // Toggle para mostrar todos los segmentos o solo el resumen
  const togglePathDetails = () => {
    setShowFullPathDetails(!showFullPathDetails);
  };

  return (
    <View style={styles.container}>
      <Header 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchDestination={searchDestination}
        searchLoading={searchLoading}
        fetchBusRoutes={fetchBusRoutes}
        loading={loading}
      />
      
      {busRoutes.length > 0 && (
        <RoutesList 
          busRoutes={busRoutes}
          selectedRoute={selectedRoute}
          setSelectedRoute={setSelectedRoute}
          showFullPathDetails={showFullPathDetails}
          togglePathDetails={togglePathDetails}
        />
      )}
      
      <RouteMap 
        mapRef={mapRef}
        origin={origin}
        setOrigin={setOrigin}
        destiny={destiny}
        selectedRoute={selectedRoute}
      />
      
      {busRoutes.length === 0 && !loading && <NoRoutesMessage />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});