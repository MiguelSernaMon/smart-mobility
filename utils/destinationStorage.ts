import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Destination {
  id: string;
  name: string;
  address: string;
  icon: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  count: number; // Número de veces que se ha buscado
  lastUsed: number; // Timestamp de último uso
}

// Clave para almacenar los destinos en AsyncStorage
const DESTINATIONS_STORAGE_KEY = 'smart_mobility_destinations';

// Obtener todos los destinos almacenados
export const getDestinations = async (): Promise<Destination[]> => {
  try {
    const data = await AsyncStorage.getItem(DESTINATIONS_STORAGE_KEY);
    if (!data) return [];
    
    // Intentar parsear con manejo de errores
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (parseError) {
      console.error("Error parsing destinations:", parseError);
      return [];
    }
  } catch (error) {
    console.error('Error al recuperar destinos:', error);
    return [];
  }
};

// Guardar un nuevo destino o actualizar uno existente
export const saveDestination = async (destination: Omit<Destination, 'count' | 'lastUsed'>): Promise<void> => {
  try {
    console.log("Guardando destino:", destination.name);
    
    // Obtenemos los destinos existentes
    const destinations = await getDestinations();
    
    // Verificamos si el destino ya existe (por nombre o por coordenadas)
    const existingIndex = destinations.findIndex(dest => {
      // Comparar por ID si está disponible
      if (destination.id && dest.id === destination.id) {
        return true;
      }
      
      // Comparar por nombre
      if (dest.name === destination.name) {
        return true;
      }
      
      // Comparar por coordenadas cercanas (Si están muy próximas, consideramos que es el mismo lugar)
      if (destination.coordinates && dest.coordinates) {
        const latDiff = Math.abs(dest.coordinates.latitude - destination.coordinates.latitude);
        const lngDiff = Math.abs(dest.coordinates.longitude - destination.coordinates.longitude);
        return (latDiff < 0.001 && lngDiff < 0.001); // Aproximadamente 100 metros
      }
      
      return false;
    });
    
    const now = Date.now();
    
    if (existingIndex !== -1) {
      // Actualizar destino existente
      destinations[existingIndex] = {
        ...destinations[existingIndex],
        count: (destinations[existingIndex].count || 0) + 1,
        lastUsed: now,
        // Actualizar la dirección en caso de que sea más precisa
        address: destination.address || destinations[existingIndex].address,
        // Mantener el icono original si no hay uno nuevo
        icon: destination.icon || destinations[existingIndex].icon
      };
      
      console.log("Destino actualizado:", destinations[existingIndex].name, "Contador:", destinations[existingIndex].count);
    } else {
      // Agregar nuevo destino
      destinations.push({
        ...destination,
        count: 1,
        lastUsed: now
      });
      
      console.log("Nuevo destino añadido:", destination.name);
    }
    
    // Guardar la lista actualizada
    await AsyncStorage.setItem(DESTINATIONS_STORAGE_KEY, JSON.stringify(destinations));
  } catch (error) {
    console.error('Error al guardar destino:', error);
    throw error; // Re-lanzar error para que pueda ser capturado por el llamante
  }
};

// Obtener destinos populares (más buscados)
export const getPopularDestinations = async (limit: number = 4): Promise<Destination[]> => {
  try {
    const destinations = await getDestinations();
    // Ordenar por frecuencia de uso (count) de mayor a menor
    return destinations
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error al obtener destinos populares:', error);
    return [];
  }
};

// Obtener destinos recientes
export const getRecentDestinations = async (limit: number = 3): Promise<Destination[]> => {
  try {
    const destinations = await getDestinations();
    // Ordenar por fecha de último uso (lastUsed) de más reciente a más antiguo
    return destinations
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, limit);
  } catch (error) {
    console.error('Error al obtener destinos recientes:', error);
    return [];
  }
};