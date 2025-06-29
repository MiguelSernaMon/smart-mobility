import React, { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import * as Location from "expo-location";
import { StyleSheet, View, Alert, StatusBar, Platform, SafeAreaView, FlatList, TouchableOpacity, Text, Modal, TextInput, ScrollView, Image } from "react-native";
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';

import Header from "@/components/Header";
import RouteMap from "@/components/RouteMap";
import NoRoutesMessage from "@/components/NoRoutesMessage";
import RouteActiveInfo from "@/components/RouteActiveInfo";
import WeatherAlert from "@/components/WeatherAlert";
import { Ionicons } from "@expo/vector-icons";
import { saveDestination } from '@/utils/destinationStorage';

// Interfaces para TypeScript
interface AudioPoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  radius: number;
  audioText: string;
  triggered: boolean;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Report {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  category: 'accessibility' | 'safety' | 'infrastructure' | 'transport' | 'other';
  imageUri?: string;
  userId: string;
  userName: string;
  timestamp: number;
  status: 'pending' | 'in_progress' | 'resolved';
}

export default function ConfirmRouteScreen() {
  const params = useLocalSearchParams();
  
  // Verificar si tenemos parámetros de destino
  const hasDestinyParams = !!(params.destinationLat && params.destinationLng);
  
  // Inicializar destino con parámetros o valores predeterminados
  const [destiny, setDestiny] = useState<Coordinates>({
    latitude: hasDestinyParams 
      ? parseFloat(params.destinationLat as string) 
      : 6.296242626909633,
    longitude: hasDestinyParams 
      ? parseFloat(params.destinationLng as string) 
      : -75.57194844226433
  });
  
  // Modificar la forma en que inicializamos searchQuery para asegurarnos de que se muestre
  const [searchQuery, setSearchQuery] = useState<string>(
    // Usar el nombre del destino si está disponible y setSearchText es true
    params.setSearchText === 'true' && params.destinationName 
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
          if (mapRef.current && (mapRef.current as any).fitToCoordinates) {
            (mapRef.current as any).fitToCoordinates(
              [origin, destiny],
              { edgePadding: { top: 100, right: 100, bottom: 100, left: 100 }, animated: true }
            );
          }
        } catch (error) {
          console.error("Error ajustando mapa:", error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [hasDestinyParams]);
  
  const mapRef = React.useRef<any>(null);
  const [statusBarHeight, setStatusBarHeight] = useState<number>(0);

  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [activeRoutePolyline, setActiveRoutePolyline] = useState<string>('');

  const [origin, setOrigin] = useState<Coordinates>({
    latitude: 6.252565,
    longitude: -75.570568,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  // Nuevos estados para el autocompletado
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState<boolean>(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  // Agregar este estado para el cache
  const [predictionsCache, setPredictionsCache] = useState<{[key: string]: any}>({});
  const [POIs, setPOIs] = useState<any[]>([]);
  const [showPOIs, setShowPOIs] = useState<boolean>(false);
  const [selectedPOITypes, setSelectedPOITypes] = useState<string[]>(['restaurant', 'tourist_attraction']);
  
  // Estados para audio de accesibilidad
  const [audioPoints, setAudioPoints] = useState<AudioPoint[]>([]);
  const [currentAudio, setCurrentAudio] = useState<any>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  // Estados para sistema de reportes
  const [reports, setReports] = useState<Report[]>([]);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [newReportLocation, setNewReportLocation] = useState<Coordinates | null>(null);
  const [reportForm, setReportForm] = useState<{
    title: string;
    description: string;
    category: Report['category'];
    imageUri: string | null;
  }>({
    title: '',
    description: '',
    category: 'accessibility',
    imageUri: null
  });

  useEffect(() => {
    setStatusBarHeight(StatusBar.currentHeight || 0);
    
    // Inicializar puntos de audio para accesibilidad
    initializeAudioPoints();
    
    // Inicializar reportes
    initializeReports();
    
    // Configurar audio para reproducir en silencio si es necesario
    configureAudio();
  }, []);

  // Nuevo efecto para monitorear cambios en ubicación y puntos de audio
  useEffect(() => {
    console.log('🔄 Cambio detectado en ubicación o puntos de audio');
    console.log('📍 UserLocation:', userLocation);
    console.log('📍 AudioPoints:', audioPoints.length);
    
    if (userLocation && audioPoints.length > 0) {
      console.log('✅ Ambos datos disponibles, verificando proximidad...');
      checkAudioPointProximity();
    }
  }, [userLocation, audioPoints]);

  // Nuevo efecto para monitorear cambios en reportes
  useEffect(() => {
    console.log('📊 Cambio detectado en reportes. Total reportes:', reports.length);
    console.log('📋 Lista completa de reportes:', reports.map(r => ({ 
      id: r.id, 
      title: r.title, 
      lat: r.latitude, 
      lng: r.longitude, 
      category: r.category 
    })));
    
    // Si hay reportes y un mapa, ajustar la vista para mostrar todos los puntos
    if (reports.length > 0 && mapRef.current) {
      setTimeout(() => {
        try {
          const allPoints = [
            origin,
            destiny,
            ...reports.map(r => ({ latitude: r.latitude, longitude: r.longitude }))
          ];
          console.log('🗺️ Ajustando mapa para mostrar todos los puntos:', allPoints);
          (mapRef.current as any)?.fitToCoordinates(allPoints, {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true
          });
        } catch (error) {
          console.error('❌ Error ajustando mapa:', error);
        }
      }, 1000);
    }
  }, [reports]);

  // Configurar audio
  const configureAudio = async () => {
    try {
      // Verificar si el speech está disponible
      const isAvailable = await Speech.isSpeakingAsync();
      console.log('Speech está disponible:', !isAvailable);
    } catch (error) {
      console.error('Error verificando disponibilidad de speech:', error);
    }
  };

  // Inicializar puntos de audio (datos quemados por ahora)
  const initializeAudioPoints = () => {
    const points = [
      {
        id: "metro_universidad_antioquia",
        latitude: 6.269373,
        longitude: -75.566537,
        title: "Estación Metro Universidad de Antioquia",
        description: "Entrada accesible al Metro",
        radius: 50, // metros
        audioText: `Punto de partida: Portería del Metro dentro del campus de la Universidad de Antioquia

Ubicación inicial:
Sales por la portería del Metro ubicada dentro del campus (zona norte, cerca de la Facultad de Medicina y el Edificio de Extensión). Aquí hay una pequeña rampa con barandas metálicas y una superficie rugosa que ayuda a identificar el cambio de zona.

Giro hacia la izquierda:
Al salir de la portería, gira hacia la izquierda. A unos pocos pasos, sentirás una baranda metálica que guía hacia las escaleras de ingreso a la estación. La pared del lado izquierdo puede servir como guía táctil.

Escaleras de subida:
Las escaleras hacia el Metro están rectas frente a ti. Son aproximadamente 15 escalones divididos en dos tramos con un descanso intermedio. Ambos tramos cuentan con pasamanos metálicos en ambos lados, ideales para apoyo. El piso tiene texturas diferentes en los bordes de los escalones, lo que puede servir como señal táctil para anticipar cada peldaño.

Ingreso a la estación:
Al subir las escaleras, sentirás un cambio en la acústica (ambiente cerrado y techado). Estás en la zona de ingreso de la estación Universidad. A tu derecha están los torniquetes y el punto de control.

Apoyo del personal:
Puedes solicitar apoyo al personal del Metro, quienes están disponibles en la entrada para guiarte hasta el andén o brindarte indicaciones. También puedes acercarte al módulo de atención al usuario.`,
        triggered: false,
      },
    ];
    setAudioPoints(points);
  };

  // Función para calcular distancia entre dos coordenadas
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
  };

  // Reproducir audio usando text-to-speech nativo
  const playAudioDescription = async (audioText: string) => {
    try {
      console.log('🔊 Intentando reproducir audio...');
      console.log('📝 Texto del audio:', audioText.substring(0, 100) + '...');
      console.log('🎵 Estado actual del audio:', { isPlayingAudio });
      
      if (isPlayingAudio) {
        console.log('⚠️ Ya hay un audio reproduciéndose, saltando...');
        return; // Ya hay un audio reproduciéndose
      }

      console.log('✅ Iniciando reproducción de audio...');
      setIsPlayingAudio(true);

      // Detener cualquier speech que esté en progreso
      await Speech.stop();
      console.log('🛑 Speech anterior detenido');

      // Configurar opciones de speech
      const speechOptions = {
        language: 'es-ES', // Español de España
        pitch: 1.0,
        rate: 0.7, // Velocidad más lenta para mejor comprensión
        voice: undefined, // Usar voz por defecto
        onStart: () => {
          console.log('✅ Audio iniciado exitosamente');
        },
        onDone: () => {
          console.log('✅ Audio terminado');
          setIsPlayingAudio(false);
        },
        onStopped: () => {
          console.log('🛑 Audio detenido');
          setIsPlayingAudio(false);
        },
        onError: (error: any) => {
          console.error('❌ Error en speech:', error);
          setIsPlayingAudio(false);
          // Mostrar alerta con el texto como fallback
          Alert.alert(
            "Información de Accesibilidad",
            audioText,
            [{ text: "Entendido" }]
          );
        }
      };

      // Reproducir el audio
      console.log('🎤 Llamando a Speech.speak...');
      Speech.speak(audioText, speechOptions);
      
      console.log('✅ Speech.speak llamado exitosamente');
      
    } catch (error) {
      console.error('❌ Error reproduciendo audio:', error);
      setIsPlayingAudio(false);
      
      // Fallback: mostrar el texto en una alerta
      Alert.alert(
        "Información de Accesibilidad",
        audioText,
        [{ text: "Entendido" }]
      );
    }
  };

  // Monitorear proximidad a puntos de audio
  const checkAudioPointProximity = async () => {
    console.log('🔍 Verificando proximidad a puntos de audio...');
    console.log('📍 Ubicación del usuario:', userLocation);
    console.log('📍 Puntos de audio disponibles:', audioPoints.length);
    
    if (!userLocation || audioPoints.length === 0) {
      console.log('⚠️ No hay ubicación de usuario o puntos de audio');
      return;
    }

    for (const point of audioPoints) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        point.latitude,
        point.longitude
      );

      console.log(`📏 Distancia al punto ${point.title}: ${distance.toFixed(2)} metros (radio: ${point.radius}m, triggered: ${point.triggered})`);

      // Si está dentro del radio y no se ha reproducido aún
      if (distance <= point.radius && !point.triggered) {
        console.log(`🔊 ¡USUARIO CERCA! Reproduciendo audio para ${point.title}...`);
        
        // Marcar como activado inmediatamente
        setAudioPoints(prevPoints => 
          prevPoints.map(p => 
            p.id === point.id ? { ...p, triggered: true } : p
          )
        );

        // Reproducir audio inmediatamente
        try {
          await playAudioDescription(point.audioText);
          console.log('✅ Audio reproducido exitosamente');
        } catch (error) {
          console.error('❌ Error reproduciendo audio:', error);
        }

        // Reset del trigger después de 2 minutos para permitir activación futura
        setTimeout(() => {
          console.log(`🔄 Reseteando trigger para ${point.title}`);
          setAudioPoints(prevPoints => 
            prevPoints.map(p => 
              p.id === point.id ? { ...p, triggered: false } : p
            )
          );
        }, 120000); // 2 minutos
      }
    }
  };

  // ============ FUNCIONES DE REPORTES ============

  // Inicializar reportes (datos quemados por ahora)
  const initializeReports = () => {
    const sampleReports: Report[] = [
      {
        id: "report_1",
        latitude: 6.254565,
        longitude: -75.572568,
        title: "Escalón dañado",
        description: "Escalón roto en la entrada del metro, peligroso para personas con discapacidad visual",
        category: 'accessibility',
        imageUri: undefined,
        userId: "user_1",
        userName: "Usuario Anónimo",
        timestamp: Date.now() - 86400000, // Hace 1 día
        status: 'pending'
      },
      {
        id: "report_2", 
        latitude: 6.270373,
        longitude: -75.567537,
        title: "Semáforo sin sonido",
        description: "El semáforo peatonal no tiene señal auditiva para personas ciegas",
        category: 'safety',
        imageUri: undefined,
        userId: "user_2",
        userName: "Reportero",
        timestamp: Date.now() - 172800000, // Hace 2 días
        status: 'pending'
      }
    ];
    setReports(sampleReports);
  };

  // Abrir modal de reporte en ubicación específica
  const openReportModal = (location: Coordinates) => {
    console.log('📍 openReportModal llamado con ubicación:', location);
    setNewReportLocation(location);
    setReportForm({
      title: '',
      description: '',
      category: 'accessibility',
      imageUri: null
    });
    setShowReportModal(true);
    console.log('📱 Modal de reporte abierto, showReportModal:', true);
  };

  // Tomar foto para el reporte
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesita permiso para acceder a la cámara');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setReportForm(prev => ({
          ...prev,
          imageUri: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  };

  // Seleccionar foto de galería
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesita permiso para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setReportForm(prev => ({
          ...prev,
          imageUri: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  // Enviar reporte
  const submitReport = async () => {
    if (!newReportLocation) {
      Alert.alert('Error', 'No se pudo obtener la ubicación para el reporte');
      return;
    }

    if (!reportForm.title.trim() || !reportForm.description.trim()) {
      Alert.alert('Error', 'Por favor completa el título y la descripción');
      return;
    }

    try {
      const newReport: Report = {
        id: `report_${Date.now()}`,
        latitude: newReportLocation.latitude,
        longitude: newReportLocation.longitude,
        title: reportForm.title.trim(),
        description: reportForm.description.trim(),
        category: reportForm.category,
        imageUri: reportForm.imageUri || undefined,
        userId: "current_user", // En una app real, obtener del contexto de autenticación
        userName: "Usuario Actual", // En una app real, obtener del contexto de autenticación
        timestamp: Date.now(),
        status: 'pending'
      };

      console.log('📝 Creando nuevo reporte:', newReport);
      console.log('📍 Ubicación del reporte:', newReportLocation);
      console.log('📊 Reportes antes de agregar:', reports.length);

      // Agregar el nuevo reporte al estado
      setReports(prevReports => {
        const updatedReports = [...prevReports, newReport];
        console.log('📊 Reportes después de agregar:', updatedReports.length);
        console.log('📋 Lista de reportes actualizada:', updatedReports.map(r => ({ id: r.id, title: r.title, lat: r.latitude, lng: r.longitude })));
        return updatedReports;
      });

      // En una app real, aquí enviarías el reporte al backend
      console.log('✅ Reporte agregado al estado exitosamente');

      // Cerrar modal y limpiar formulario
      setShowReportModal(false);
      setNewReportLocation(null);
      setReportForm({
        title: '',
        description: '',
        category: 'accessibility',
        imageUri: null
      });

      Alert.alert(
        'Reporte enviado',
        'Tu reporte ha sido enviado exitosamente. Gracias por ayudar a mejorar la accesibilidad.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error enviando reporte:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte. Inténtalo de nuevo.');
    }
  };

  // Manejar presión en reporte del mapa
  const handleReportPress = (report: Report) => {
    const timeAgo = Math.floor((Date.now() - report.timestamp) / (1000 * 60 * 60 * 24));
    const timeText = timeAgo === 0 ? 'Hoy' : `Hace ${timeAgo} día${timeAgo > 1 ? 's' : ''}`;
    
    Alert.alert(
      report.title,
      `${report.description}\n\nCategoría: ${getCategoryDisplayName(report.category)}\nReportado por: ${report.userName}\nFecha: ${timeText}\nEstado: ${getStatusDisplayName(report.status)}`,
      [
        ...(report.imageUri ? [{
          text: "Ver imagen",
          onPress: () => {
            // En una app real, aquí abrirías un modal con la imagen
            Alert.alert("Imagen", "Funcionalidad de vista de imagen en desarrollo");
          }
        }] : []),
        {
          text: "Cerrar",
          style: "cancel"
        }
      ]
    );
  };

  // Funciones auxiliares para reportes
  const getCategoryDisplayName = (category: Report['category']) => {
    const names = {
      'accessibility': 'Accesibilidad',
      'safety': 'Seguridad',
      'infrastructure': 'Infraestructura',
      'transport': 'Transporte',
      'other': 'Otro'
    };
    return names[category] || 'Otro';
  };

  const getStatusDisplayName = (status: Report['status']) => {
    const names = {
      'pending': 'Pendiente',
      'in_progress': 'En progreso',
      'resolved': 'Resuelto'
    };
    return names[status] || 'Pendiente';
  };

  // ============ FIN FUNCIONES DE REPORTES ============

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
    const newOrigin = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    
    setOrigin(newOrigin);
    setUserLocation(newOrigin);
    
    // Iniciar monitoreo de ubicación para puntos de audio
    startLocationMonitoring();
  }

  // Iniciar monitoreo continuo de ubicación para puntos de audio
  const startLocationMonitoring = async () => {
    try {
      console.log('🚀 Iniciando monitoreo de ubicación para puntos de audio...');
      
      // Solicitar permisos de ubicación en primer plano
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('⚠️ Permisos de ubicación denegados');
        return;
      }

      console.log('✅ Permisos de ubicación concedidos, configurando seguimiento...');

      // Configurar el seguimiento de ubicación
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 5000, // Actualizar cada 5 segundos
          distanceInterval: 10, // O cuando se mueva al menos 10 metros
        },
        (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          console.log('📍 Nueva ubicación recibida:', newLocation);
          setUserLocation(newLocation);
          
          // Verificar proximidad a puntos de audio
          checkAudioPointProximity();
        }
      );

      console.log('✅ Monitoreo de ubicación configurado exitosamente');

      // Guardar la suscripción para poder cancelarla después
      return () => {
        console.log('🛑 Deteniendo monitoreo de ubicación');
        subscription.remove();
      };
    } catch (error) {
      console.error('❌ Error configurando monitoreo de ubicación:', error);
    }
  };

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

  // Al inicio del componente, después de obtener los parámetros
useEffect(() => {
  // Si hay un nombre de destino, establecerlo en el campo de búsqueda
  if (params.destinationName) {
    setSearchQuery(params.destinationName as string);
    
    // Si además tenemos coordenadas y son válidas, establecer el destino
    if (hasDestinyParams) {
      // Ya establecimos el destino con useState al inicio
      
      // Si tenemos un ID de destino, podríamos guardar este uso en el historial
      if (params.destinationId) {
        // Esto lo estamos manejando con useDestination en HomeScreen
      }
    }
  }
}, [params.destinationName]);

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
        onPOIPress={(poi: any) => handlePOIPress(poi)}
        audioPoints={audioPoints}
        onAudioPointPress={(point: AudioPoint) => {
          Alert.alert(
            point.title,
            point.description,
            [
              {
                text: "Reproducir audio",
                onPress: () => playAudioDescription(point.audioText)
              },
              {
                text: "Cerrar",
                style: "cancel"
              }
            ]
          );
        }}
        reports={reports}
        onMapPress={openReportModal}
        onReportPress={handleReportPress}
      />
      
      {/* Botón flotante para probar audio de accesibilidad */}
      <TouchableOpacity
        style={[styles.accessibilityButton, { backgroundColor: isPlayingAudio ? '#FF8A65' : '#FF6B35' }]}
        onPress={() => {
          if (isPlayingAudio) {
            // Detener audio si está reproduciéndose
            Speech.stop();
            setIsPlayingAudio(false);
            console.log('Audio detenido manualmente');
          } else if (audioPoints.length > 0) {
            console.log('Probando audio manualmente...');
            playAudioDescription(audioPoints[0].audioText);
          } else {
            console.log('No hay puntos de audio configurados');
            Alert.alert('Prueba de Audio', 'No hay puntos de audio configurados');
          }
        }}
      >
        <Ionicons 
          name={isPlayingAudio ? "stop" : "volume-high"} 
          size={24} 
          color="white" 
        />
      </TouchableOpacity>

      {/* Botón flotante para crear reportes */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => {
          if (userLocation) {
            openReportModal(userLocation);
          } else {
            Alert.alert(
              'Ubicación requerida',
              'Para crear un reporte necesitamos tu ubicación actual. Por favor, activa el GPS.',
              [{ text: 'OK' }]
            );
          }
        }}
      >
        <Ionicons name="camera" size={24} color="white" />
      </TouchableOpacity>

      {/* Botón adicional para probar audio simple */}
      <TouchableOpacity
        style={styles.testAudioButton}
        onPress={() => {
          console.log('🔊 Probando audio simple...');
          playAudioDescription("Hola, esto es una prueba de audio para accesibilidad. Si puedes escuchar esto, el sistema de audio está funcionando correctamente.");
        }}
      >
        <Text style={styles.testAudioText}>🔊 Probar Audio</Text>
      </TouchableOpacity>

      {/* Botón para simular proximidad al punto de audio */}
      <TouchableOpacity
        style={styles.simulateProximityButton}
        onPress={() => {
          console.log('🎯 Simulando proximidad al punto de audio...');
          if (audioPoints.length > 0) {
            console.log('📍 Configurando ubicación simulada cerca del punto de audio...');
            const point = audioPoints[0];
            
            // Simular que estamos muy cerca del punto (5 metros)
            const simulatedLocation = {
              latitude: point.latitude + 0.00004, // Aproximadamente 5 metros
              longitude: point.longitude + 0.00004
            };
            
            console.log('📍 Ubicación simulada:', simulatedLocation);
            setUserLocation(simulatedLocation);
            
            // Forzar verificación inmediata
            setTimeout(() => {
              console.log('🔍 Forzando verificación de proximidad...');
              checkAudioPointProximity();
            }, 1000);
          } else {
            console.log('⚠️ No hay puntos de audio configurados');
          }
        }}
      >
        <Text style={styles.testAudioText}>🎯 Simular Cerca</Text>
      </TouchableOpacity>
      
      {/* Mostrar mensaje solo si no hay ruta activa ni está cargando */}
      {!loading && !activeRoute && !showPredictions && <NoRoutesMessage />}

      {/* Debug info para reportes */}
      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Reportes: {reports.length}</Text>
          <Text style={styles.debugText}>
            {reports.map(r => `${r.id}: ${r.title}`).join(', ')}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: 'blue', padding: 5, marginTop: 5, borderRadius: 3 }}
            onPress={() => {
              const testReport: Report = {
                id: `test_${Date.now()}`,
                latitude: 6.255000,
                longitude: -75.573000,
                title: "Reporte de prueba",
                description: "Este es un reporte de prueba",
                category: 'safety',
                userId: "debug_user",
                userName: "Debug User",
                timestamp: Date.now(),
                status: 'pending'
              };
              console.log('🧪 Agregando reporte de prueba:', testReport);
              setReports(prev => {
                const updated = [...prev, testReport];
                console.log('🧪 Reportes después de agregar prueba:', updated.length);
                return updated;
              });
            }}
          >
            <Text style={styles.debugText}>Agregar Reporte Prueba</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal para reporte de incidencias */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Reporte</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Título del reporte"
              value={reportForm.title}
              onChangeText={text => setReportForm(prev => ({ ...prev, title: text }))}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Descripción del reporte"
              value={reportForm.description}
              onChangeText={text => setReportForm(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
            
            {/* Selector de categoría (nuevo diseño) */}
            <View style={styles.categorySelector}>
              <TouchableOpacity
                style={[styles.categoryButton, reportForm.category === 'accessibility' && styles.categoryButtonSelected]}
                onPress={() => setReportForm(prev => ({ ...prev, category: 'accessibility' }))}
              >
                <Ionicons name="accessibility" size={16} color={reportForm.category === 'accessibility' ? 'white' : '#333'} />
                <Text style={[styles.categoryButtonText, reportForm.category === 'accessibility' && styles.categoryButtonTextSelected]}>Accesibilidad</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryButton, reportForm.category === 'safety' && styles.categoryButtonSelected]}
                onPress={() => setReportForm(prev => ({ ...prev, category: 'safety' }))}
              >
                <Ionicons name="warning" size={16} color={reportForm.category === 'safety' ? 'white' : '#333'} />
                <Text style={[styles.categoryButtonText, reportForm.category === 'safety' && styles.categoryButtonTextSelected]}>Seguridad</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryButton, reportForm.category === 'infrastructure' && styles.categoryButtonSelected]}
                onPress={() => setReportForm(prev => ({ ...prev, category: 'infrastructure' }))}
              >
                <Ionicons name="construct" size={16} color={reportForm.category === 'infrastructure' ? 'white' : '#333'} />
                <Text style={[styles.categoryButtonText, reportForm.category === 'infrastructure' && styles.categoryButtonTextSelected]}>Infraestructura</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryButton, reportForm.category === 'transport' && styles.categoryButtonSelected]}
                onPress={() => setReportForm(prev => ({ ...prev, category: 'transport' }))}
              >
                <Ionicons name="bus" size={16} color={reportForm.category === 'transport' ? 'white' : '#333'} />
                <Text style={[styles.categoryButtonText, reportForm.category === 'transport' && styles.categoryButtonTextSelected]}>Transporte</Text>
              </TouchableOpacity>
            </View>
            
            {/* Botones para tomar foto o seleccionar de galería */}
            <View style={styles.imagePickerContainer}>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={takePhoto}
              >
                <Ionicons name="camera" size={24} color="white" />
                <Text style={styles.imagePickerText}>Tomar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <Ionicons name="images" size={24} color="white" />
                <Text style={styles.imagePickerText}>Seleccionar Imagen</Text>
              </TouchableOpacity>
            </View>
            
            {/* Vista previa de la imagen seleccionada */}
            {reportForm.imageUri && (
              <Image
                source={{ uri: reportForm.imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            )}
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={submitReport}
            >
              <Text style={styles.submitButtonText}>Enviar Reporte</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowReportModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  </>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accessibilityButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#FF6B35',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  reportButton: {
    position: 'absolute',
    bottom: 80,
    right: 90,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  testAudioButton: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  simulateProximityButton: {
    position: 'absolute',
    bottom: 220,
    right: 20,
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  testAudioText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  categoryButton: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryButtonSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 5,
  },
  categoryButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  imagePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imagePickerButton: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    marginHorizontal: 5,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  imagePickerText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 5,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 4,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#757575',
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  debugInfo: {
    position: 'absolute',
    top: 100,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
  },
});