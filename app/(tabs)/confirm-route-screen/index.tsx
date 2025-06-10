import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Location from "expo-location";
import { StyleSheet, View, Alert, StatusBar, Platform, SafeAreaView, FlatList, TouchableOpacity, Text } from "react-native";
import { router } from 'expo-router';

import Header from "@/components/Header";
import RouteMap from "@/components/RouteMap";
import NoRoutesMessage from "@/components/NoRoutesMessage";
import RouteActiveInfo from "@/components/RouteActiveInfo";
import WeatherAlert from "@/components/WeatherAlert";
import { Ionicons } from "@expo/vector-icons";
import { saveDestination } from '@/utils/destinationStorage';

export default function ConfirmRouteScreen() {
  const params = useLocalSearchParams();
  
  // Verificar si tenemos parámetros de destino
  const hasDestinyParams = !!(params.destinationLat && params.destinationLng);
  
  // Inicializar destino con parámetros o valores predeterminados
  const [destiny, setDestiny] = useState({
    latitude: hasDestinyParams 
      ? parseFloat(params.destinationLat as string) 
      : 6.296242626909633,
    longitude: hasDestinyParams 
      ? parseFloat(params.destinationLng as string) 
      : -75.57194844226433
  });
  
  // Inicializar searchQuery con el parámetro destinationName si está disponible
  const [searchQuery, setSearchQuery] = useState(
    params.destinationName 
      ? params.destinationName as string 
      : params.searchQuery as string || ''
  );
  
  // Si recibimos un searchQuery directo y no hay destinationName, buscar automáticamente
  useEffect(() => {
    if (params.searchQuery && !params.destinationName && !hasDestinyParams) {
      const query = params.searchQuery as string;
      if (query.length > 3) {
        setSearchQuery(query);
        // Pequeño retraso para asegurar que la UI esté lista
        const timer = setTimeout(() => {
          searchDestination();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [params.searchQuery]);
  
  // Si hay parámetros de destino, ajustar el mapa para mostrar origen y destino
  useEffect(() => {
    if (hasDestinyParams && mapRef.current) {
      // Corto retraso para asegurar que el mapa esté listo
      const timer = setTimeout(() => {
        try {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(
              [origin, destiny],
              { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
            );
          }
          
          // Si tenemos un destinationId, mostrar opciones para buscar rutas
          if (params.destinationId) {
            setPrepareRequest(true);
            // Opcional: Mostrar una mini tarjeta o botón flotante para buscar rutas
          }
        } catch (error) {
          console.error("Error ajustando mapa:", error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [hasDestinyParams]);
  
  const mapRef = React.useRef(null);
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  const [activeRoute, setActiveRoute] = useState(null);
  const [activeRoutePolyline, setActiveRoutePolyline] = useState('');

  const [origin, setOrigin] = useState({
    latitude: 6.252565,
    longitude: -75.570568,
  });

  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Nuevos estados para el autocompletado
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [searchTimer, setSearchTimer] = useState(null);
  // Agregar este estado para el cache
  const [predictionsCache, setPredictionsCache] = useState({});
  const [POIs, setPOIs] = useState([]);
  const [showPOIs, setShowPOIs] = useState(false);
  const [selectedPOITypes, setSelectedPOITypes] = useState(['restaurant', 'tourist_attraction']);
  useEffect(() => {
    setStatusBarHeight(StatusBar.currentHeight || 0);
  }, []);

  useEffect(() => {
    if (params.selectedRouteId && params.polyline) {
      setActiveRoutePolyline(params.polyline as string);
      
      // Si tenemos detalles de la ruta
      if (params.routeDetails) {
        try {
          const routeDetails = JSON.parse(params.routeDetails as string);
          
          // Si los segmentos están serializados, los deserializamos
          if (typeof routeDetails.segments === 'string') {
            routeDetails.segments = JSON.parse(routeDetails.segments);
          }
          
          setActiveRoute(routeDetails);
          
          // Actualizar origen y destino si existen en los detalles
          if (routeDetails.origin) {
            setOrigin(routeDetails.origin);
          }
          
          if (routeDetails.destination) {
            setDestiny(routeDetails.destination);
          }
        } catch (error) {
          console.error('Error parsing route details:', error);
        }
      }
      setTimeout(() => {
        fetchNearbyPOI(selectedPOITypes);
      }, 1000);
    }
  }, [params.selectedRouteId, params.polyline, params.routeDetails]);

 

  const fetchNearbyPOI = async (types = ['restaurant', 'cafe', 'shopping_mall', 'tourist_attraction']) => {
    if (!activeRoute || !activeRoutePolyline) {
      console.log("No hay ruta activa para buscar POI cercanos");
      return;
    }

    try {
      // Tomamos algunos puntos a lo largo de la ruta para buscar POI cerca de ellos
      const bounds = getRouteBounds(activeRoute.segments);
      const center = {
        lat: (bounds.north + bounds.south) / 2,
        lng: (bounds.east + bounds.west) / 2
      };

      // Calcular un radio aproximado que cubra la ruta
      const radius = calculateRouteRadius(bounds);
      
      console.log(`Buscando POI cerca de (${center.lat}, ${center.lng}) con radio ${radius}m`);
      
      // Hacer la solicitud a la API para cada tipo de lugar
      const allPOIs = [];
      for (const type of types) {
        const trafficRelated = ['school', 'police', 'hospital'].includes(type);
    const rankByParam = trafficRelated ? '&rankby=prominence' : '';
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${center.lat},${center.lng}&radius=${radius}&type=${type}${rankByParam}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}`
    );
        
        const data = await response.json();
        
        if (data.status === 'OK' && data.results) {
          console.log(`Encontrados ${data.results.length} lugares de tipo ${type}`);
          
          // Agregar el tipo al resultado para identificarlo en el mapa
          const typedResults = data.results.map(place => ({
            ...place,
            placeType: type
          }));
          
          allPOIs.push(...typedResults);
        }
      }
      
      setPOIs(allPOIs);
      return allPOIs;
    } catch (error) {
      console.error('Error al buscar POI cercanos:', error);
      return [];
    }
  };

  // Función auxiliar para calcular los límites de la ruta
  const getRouteBounds = (segments) => {
    let north = -90, south = 90, east = -180, west = 180;
    
    segments.forEach(segment => {
      if (segment.startLocation) {
        north = Math.max(north, segment.startLocation.lat);
        south = Math.min(south, segment.startLocation.lat);
        east = Math.max(east, segment.startLocation.lng);
        west = Math.min(west, segment.startLocation.lng);
      }
      
      if (segment.endLocation) {
        north = Math.max(north, segment.endLocation.lat);
        south = Math.min(south, segment.endLocation.lat);
        east = Math.max(east, segment.endLocation.lng);
        west = Math.min(west, segment.endLocation.lng);
      }
    });
    
    return { north, south, east, west };
  };

  // Calcular un radio aproximado para la búsqueda
  const calculateRouteRadius = (bounds) => {
    // Calcular la distancia en metros entre los extremos
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = bounds.south * Math.PI / 180;
    const φ2 = bounds.north * Math.PI / 180;
    const Δφ = (bounds.north - bounds.south) * Math.PI / 180;
    const Δλ = (bounds.east - bounds.west) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Usar un radio que cubra bien el área de la ruta (mínimo 500m, máximo 2000m)
    return Math.min(Math.max(distance / 2, 500), 2000);
  };

  // Nueva función para buscar predicciones de lugares
  const searchPlacePredictions = async (input) => {
    if (!input || input.length < 3) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }
  
    // Verificar si ya tenemos este término en cache
    if (predictionsCache[input]) {
      console.log("Usando resultados en caché para:", input);
      setPredictions(predictionsCache[input]);
      setShowPredictions(predictionsCache[input].length > 0);
      return;
    }
    
    try {
      console.log("Buscando predicciones para:", input);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&components=country:co&location=${origin.latitude},${origin.longitude}&radius=50000&strictbounds=true&key=${
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY
        }`
      );
    
      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        console.error("API no autorizada:", data.error_message);
        return;
      }
      
      if (data.predictions && data.predictions.length > 0) {
        console.log("Predicciones encontradas:", data.predictions.length);
        
        // Guardar en cache
        setPredictionsCache(prev => ({
          ...prev,
          [input]: data.predictions
        }));
        
        setPredictions(data.predictions);
        setShowPredictions(true);
      } else {
        console.log("No se encontraron predicciones");
        
        // Guardar también los resultados vacíos para evitar consultas repetidas
        setPredictionsCache(prev => ({
          ...prev,
          [input]: []
        }));
        
        setPredictions([]);
        setShowPredictions(false);
      }
    } catch (error) {
      console.error("Error buscando predicciones:", error);
    }
  };

  // Función actualizada para manejar cambios en el texto de búsqueda
  const handleSearchTextChange = (text) => {
    setSearchQuery(text);
    
    // Cancelar cualquier solicitud previa pendiente
    if (searchTimer) clearTimeout(searchTimer);
    
    // Solo realizar la búsqueda si hay suficientes caracteres y después de un retraso
    if (text.length >= 3) {
      const timer = setTimeout(() => {   // ← Aquí defines timer como una constante local
        searchPlacePredictions(text);
      }, 500); // Espera 500ms después de que el usuario deje de escribir
      
      setSearchTimer(timer);   // ← Pero necesitas usar esta variable fuera de este scope
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };
  // Función para seleccionar una predicción
  const selectPrediction = async (prediction) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry,formatted_address&key=${
          process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY
        }`
      );

      const data = await response.json();
      if (data.result && data.result.geometry && data.result.geometry.location) {
        const location = data.result.geometry.location;
        const newDestiny = {
          latitude: location.lat,
          longitude: location.lng
        };
        
        setDestiny(newDestiny);
        setSearchQuery(prediction.description);
        setShowPredictions(false);
        
        // Guardar este destino en el almacenamiento local
        const destinationData = {
          id: prediction.place_id,
          name: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
          address: data.result.formatted_address || prediction.description,
          icon: determineIconFromAddress(prediction.description),
          coordinates: {
            latitude: location.lat,
            longitude: location.lng
          }
        };
        
        // Guardar en almacenamiento con try-catch para manejar errores
        try {
          await saveDestination(destinationData);
          console.log("Destino guardado exitosamente:", destinationData.name);
          
          // Notificar que los destinos han sido actualizados
          if (global.destinationUpdateListeners) {
            global.destinationUpdateListeners.forEach(callback => callback());
          }
        } catch (error) {
          console.error("Error guardando destino:", error);
        }
        
        if (mapRef.current) {
          mapRef.current.fitToCoordinates(
            [origin, newDestiny],
            { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
          );
        }
        
        Alert.alert(
          "Destino establecido",
          `Destino: ${data.result.formatted_address || prediction.description}`,
          [
            { text: "Buscar rutas", onPress: () => fetchBusRoutes(newDestiny) },
            { text: "OK" }
          ]
        );
      }
    } catch (error) {
      console.error("Error obteniendo detalles del lugar:", error);
      Alert.alert("Error", "No se pudieron obtener los detalles del lugar seleccionado");
    }
  };
  // Agregar esta función auxiliar para determinar el icono basado en la dirección
const determineIconFromAddress = (address) => {
  address = address.toLowerCase();
  
  if (address.includes('universidad') || address.includes('colegio') || address.includes('escuela')) {
    return 'school';
  } else if (address.includes('hospital') || address.includes('clínica')) {
    return 'medkit';
  } else if (address.includes('centro comercial') || address.includes('mall')) {
    return 'cart';
  } else if (address.includes('parque')) {
    return 'leaf';
  } else if (address.includes('aeropuerto')) {
    return 'airplane';
  } else if (address.includes('restaurante') || address.includes('café')) {
    return 'restaurant';
  } else if (address.includes('hotel')) {
    return 'bed';
  } else if (address.includes('estación')) {
    return 'train';
  } else {
    return 'location';
  }
};

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
        
        // Guardar este destino en el almacenamiento local
        const destinationData = {
          id: data.results[0].place_id || Date.now().toString(),
          name: searchQuery.split(',')[0],
          address: data.results[0].formatted_address,
          icon: determineIconFromAddress(data.results[0].formatted_address),
          coordinates: {
            latitude: location.lat,
            longitude: location.lng
          }
        };
        
        // Guardar en almacenamiento con try-catch para manejar errores
        try {
          await saveDestination(destinationData);
          console.log("Destino guardado exitosamente:", destinationData.name);
          
          // Notificar que los destinos han sido actualizados
          if (global.destinationUpdateListeners) {
            global.destinationUpdateListeners.forEach(callback => callback());
          }
        } catch (error) {
          console.error("Error guardando destino:", error);
        }
        
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
            { text: "Buscar rutas", onPress: () => fetchBusRoutes(newDestiny) },
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

  const fetchBusRoutes = async (destinationCoords = null) => {
    setLoading(true);
    const destCoords = destinationCoords || destiny;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destCoords.latitude},${destCoords.longitude}&mode=transit&alternatives=true&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}`
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

        // Guardar las rutas en el almacenamiento local (puedes usar AsyncStorage)
        // y navegar a la página de explore
        router.push({
          pathname: '/(tabs)/explore',
          params: { routes: JSON.stringify(processedRoutes) }
        });
        
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

  // Cancelar la ruta activa
  const cancelActiveRoute = () => {
    setActiveRoute(null);
    setActiveRoutePolyline('');
    
    // Volver a ajustar el mapa para mostrar origen y destino
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [origin, destiny],
        { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
      );
    }
  };

  useEffect(() => {
    getLocationPermission();
  }, []);

  const handlePOIPress = (poi) => {
    Alert.alert(
      poi.name,
      `${poi.vicinity}\n\nCalificación: ${poi.rating || 'No disponible'}/5`,
      [
        {
          text: "Ver detalles",
          onPress: () => fetchPOIDetails(poi.place_id)
        },
        {
          text: "Cerrar",
          style: "cancel"
        }
      ]
    );
  };

  // Obtener detalles adicionales del POI
  const fetchPOIDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,photos,reviews&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        // Aquí podrías mostrar una modal o navegar a una pantalla con los detalles
        Alert.alert(
          data.result.name,
          `Dirección: ${data.result.formatted_address}\nTeléfono: ${data.result.formatted_phone_number || 'No disponible'}\nWeb: ${data.result.website || 'No disponible'}`,
          [
            {
              text: "Ir a este lugar",
              onPress: () => {
                // Aquí podrías implementar la navegación a este POI
                Alert.alert("Funcionalidad en desarrollo", "Próximamente podrás navegar a este lugar");
              }
            },
            {
              text: "Cerrar",
              style: "cancel"
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error al obtener detalles del POI:', error);
    }
  };

  return (
    <>
   <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
    <SafeAreaView style={styles.container}>
      {/* Espacio para la barra de estado en Android */}
      {Platform.OS === 'android' && (
        <View style={{ height: statusBarHeight }} />
      )}
      <WeatherAlert />
      {/* Solo mostrar el header de búsqueda si no hay ruta activa */}
      {!activeRoute ? (
        <>
          <Header 
            searchQuery={searchQuery}
            setSearchQuery={handleSearchTextChange}
            searchDestination={searchDestination}
            searchLoading={searchLoading}
            fetchBusRoutes={() => fetchBusRoutes()}
            loading={loading}
          />
          
          {/* Lista de predicciones */}
          {showPredictions && predictions.length > 0 && (
            <View style={styles.predictionsContainer}>
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.predictionItem}
                    onPress={() => selectPrediction(item)}
                  >
                    <Ionicons name="location" size={18} color="#666" style={styles.predictionIcon} />
                    <View style={styles.predictionTextContainer}>
                      <Text style={styles.predictionText} numberOfLines={1}>
                        {item.structured_formatting?.main_text || item.description.split(',')[0]}
                      </Text>
                      <Text style={styles.predictionSecondaryText} numberOfLines={1}>
                        {item.structured_formatting?.secondary_text || item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.predictionsList}
              />
            </View>
          )}
        </>
      ) : (
        <RouteActiveInfo 
          route={activeRoute} 
          onCancel={cancelActiveRoute} 
        />
      )}
      
      <RouteMap 
        mapRef={mapRef}
        origin={origin}
        setOrigin={setOrigin}
        destiny={destiny}
        activeRoutePolyline={activeRoutePolyline}
        POIs={showPOIs ? POIs : []}
        onPOIPress={(poi) => handlePOIPress(poi)}
      />
      
      {/* Mostrar mensaje solo si no hay ruta activa ni está cargando */}
      {!loading && !activeRoute && !showPredictions && <NoRoutesMessage />}
    </SafeAreaView>
  </>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  predictionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 90 + (StatusBar.currentHeight || 0) : 90,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  predictionsList: {
    borderRadius: 8,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  predictionIcon: {
    marginRight: 10,
  },
  predictionTextContainer: {
    flex: 1,
  },
  predictionText: {
    fontSize: 16,
    color: '#333',
  },
  predictionSecondaryText: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
});