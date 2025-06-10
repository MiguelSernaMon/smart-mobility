import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitEvent } from './eventBus';

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
    
    // Verificamos si el destino ya existe
    const existingIndex = destinations.findIndex(dest => {
      // Comparaciones como antes...
      if (destination.id && dest.id === destination.id) return true;
      if (dest.name === destination.name) return true;
      
      if (destination.coordinates && dest.coordinates) {
        const latDiff = Math.abs(dest.coordinates.latitude - destination.coordinates.latitude);
        const lngDiff = Math.abs(dest.coordinates.longitude - destination.coordinates.longitude);
        return (latDiff < 0.001 && lngDiff < 0.001);
      }
      
      return false;
    });
    
    const now = Date.now();
    let updatedDestinations = [...destinations];
    
    if (existingIndex !== -1) {
      // Actualizar destino existente
      updatedDestinations[existingIndex] = {
        ...updatedDestinations[existingIndex],
        count: (updatedDestinations[existingIndex].count || 0) + 1,
        lastUsed: now,
        address: destination.address || updatedDestinations[existingIndex].address,
        icon: destination.icon || updatedDestinations[existingIndex].icon
      };
      
      console.log("Destino actualizado:", updatedDestinations[existingIndex].name, "Contador:", updatedDestinations[existingIndex].count);
    } else {
      // Agregar nuevo destino
      updatedDestinations.push({
        ...destination,
        count: 1,
        lastUsed: now
      });
      
      console.log("Nuevo destino añadido:", destination.name);
    }
    
    // Guardar la lista actualizada
    await AsyncStorage.setItem(DESTINATIONS_STORAGE_KEY, JSON.stringify(updatedDestinations));
    
    // Emitir evento de actualización
    emitEvent('destinationUpdate');
  } catch (error) {
    console.error('Error al guardar destino:', error);
    throw error;
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

// Agregar nueva función para usar un destino (incrementa el contador pero no añade nuevo)
export const useDestination = async (destinationId: string): Promise<Destination | null> => {
  try {
    // Obtener destinos existentes
    const destinations = await getDestinations();
    
    // Buscar el destino por ID
    const destinationIndex = destinations.findIndex(dest => dest.id === destinationId);
    
    if (destinationIndex === -1) {
      console.error('Destino no encontrado:', destinationId);
      return null;
    }
    
    // Actualizar contador y fecha de último uso
    const now = Date.now();
    destinations[destinationIndex] = {
      ...destinations[destinationIndex],
      count: (destinations[destinationIndex].count || 0) + 1,
      lastUsed: now
    };
    
    // Guardar la lista actualizada
    await AsyncStorage.setItem(DESTINATIONS_STORAGE_KEY, JSON.stringify(destinations));
    
    // Emitir evento de actualización
    emitEvent('destinationUpdate');
    
    // Retornar el destino actualizado
    return destinations[destinationIndex];
  } catch (error) {
    console.error('Error al usar destino:', error);
    return null;
  }
};