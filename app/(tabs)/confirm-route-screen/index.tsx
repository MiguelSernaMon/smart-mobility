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
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destiny.latitude},${destiny.longitude}&mode=transit&alternatives=true&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}`
      );
      
      const data = await response.json();
      
      
      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const processedRoutes = data.routes.map((route, index) => {
          // Extraer todos los pasos (steps) de la ruta
          const allSteps = route.legs[0].steps;
          
          // Procesar todos los segmentos (caminata, bus, metro, etc.)
          const routeSegments = allSteps.map((step, stepIndex) => {
            if (step.travel_mode === 'WALKING') {
              // Código existente para caminata...
              const nextTransitIndex = allSteps.findIndex((s, idx) => 
                idx > stepIndex && s.travel_mode === 'TRANSIT'
              );
              
              let toTransitStop = '';
              if (nextTransitIndex !== -1) {
                toTransitStop = allSteps[nextTransitIndex].transit_details?.departure_stop?.name || '';
              }
              
              return {
                type: 'WALKING',
                duration: step.duration.text,
                distance: step.distance.text,
                instructions: step.html_instructions,
                polyline: step.polyline.points,
                startLocation: step.start_location,
                endLocation: step.end_location,
                toBusStop: toTransitStop,
                isFirst: stepIndex === 0,
                isLast: stepIndex === allSteps.length - 1
              };
            } 
            else if (step.travel_mode === 'TRANSIT') {
              // Determinar el tipo de transporte
              const vehicleType = step.transit_details?.line?.vehicle?.type?.toLowerCase();
              
              // Detectar si es Metro de Medellín (por nombre o alguna característica)
              const isMetro = 
                vehicleType === 'subway' || 
                (step.transit_details?.line?.name && 
                 step.transit_details.line.name.toLowerCase().includes('metro'));
              
              if (isMetro) {
                // Es el Metro de Medellín
                // Determinar qué línea es (A o B) basado en las estaciones o coordenadas
                const line = determineMetroLine(
                  step.transit_details?.departure_stop?.location,
                  step.transit_details?.arrival_stop?.location
                );
                
                return {
                  type: 'METRO',
                  line: line, // "A" o "B"
                  name: `Metro Línea ${line}`,
                  departureStop: step.transit_details?.departure_stop?.name,
                  arrivalStop: step.transit_details?.arrival_stop?.name,
                  departureTime: step.transit_details?.departure_time?.text,
                  arrivalTime: step.transit_details?.arrival_time?.text,
                  numStops: step.transit_details?.num_stops,
                  duration: step.duration?.text,
                  polyline: step.polyline.points
                };
              }
              else if (vehicleType === 'bus') {
                // Código existente para autobús...
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
              else {
                // Código existente para otros transportes...
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
            }
            return null;
          }).filter(Boolean);
          
          // Obtener información específica de autobuses para la vista de resumen
          const busSteps = allSteps.filter(step => 
            step.travel_mode === 'TRANSIT' && 
            step.transit_details?.line?.vehicle?.type?.toLowerCase() === 'bus'
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
  
          // Obtener información específica del metro para la vista de resumen
          const metroSegments = routeSegments.filter(segment => segment.type === 'METRO');
          
          return {
            id: index,
            duration: route.legs[0].duration.text,
            distance: route.legs[0].distance.text,
            buses: buses,
            metro: metroSegments,
            segments: routeSegments,
            polyline: route.overview_polyline.points,
            fare: route.fare?.text || 'Información no disponible',
            departureTime: route.legs[0].departure_time?.text,
            arrivalTime: route.legs[0].arrival_time?.text,
            totalSegments: routeSegments.length
          };
        });
        
        setBusRoutes(processedRoutes);
        
        if (processedRoutes.length > 0) {
          setSelectedRoute(processedRoutes[0]);
        }
      } else {
        Alert.alert(
          "No se encontraron rutas",
          "No pudimos encontrar rutas disponibles para tu destino.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error al buscar rutas:', error);
      Alert.alert(
        "Error",
        "Ocurrió un error al buscar rutas. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const determineMetroLine = (departureLocation, arrivalLocation) => {
    // Coordenadas aproximadas de las líneas
    const lineALatitudeRange = [6.19, 6.33]; // Rango de latitud para Línea A
    const lineALongitudeRange = [-75.58, -75.55]; // Rango de longitud para Línea A
    
    const lineBLatitudeRange = [6.24, 6.27]; // Rango de latitud para Línea B
    const lineBLongitudeRange = [-75.57, -75.51]; // Rango de longitud para Línea B
    
    // Si las coordenadas están en el rango de la Línea A
    if (departureLocation && arrivalLocation) {
      // Verificar si las coordenadas están más cerca de línea A o B
      // Aquí podrías implementar una lógica más sofisticada
      if (departureLocation.lat > 6.24 && departureLocation.lng < -75.56) {
        return "A";
      } else {
        return "B";
      }
    }
    
    // Por defecto, retornar línea A
    return "A";
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