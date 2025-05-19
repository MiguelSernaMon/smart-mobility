// components/WeatherAlert.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WeatherData {
  currentTemp: number;
  precipitationProbability: number;
  nextHoursMaxPrecipitation: number;
}

const WeatherAlert = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(true);

  useEffect(() => {
    fetchWeatherData();
  }, []);
  
  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      // Usar coordenadas para Medellín
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=6.2518&longitude=-75.5636&hourly=temperature_2m,precipitation_probability&timezone=auto&forecast_days=1'
      );
      
      const data = await response.json();
      
      if (!data || !data.hourly) {
        throw new Error('Datos de clima no disponibles');
      }
      
      // Obtener hora actual
      const now = new Date();
      const currentHour = now.getHours();
      
      // Obtener temperatura actual y probabilidad de precipitación
      const currentTemp = data.hourly.temperature_2m[currentHour];
      const precipitationProbability = data.hourly.precipitation_probability[currentHour];
      
      // Calcular máxima probabilidad de precipitación en las próximas 6 horas
      const nextHours = data.hourly.precipitation_probability.slice(
        currentHour, 
        Math.min(currentHour + 6, data.hourly.precipitation_probability.length)
      );
      const nextHoursMaxPrecipitation = Math.max(...nextHours);
      
      setWeatherData({
        currentTemp,
        precipitationProbability,
        nextHoursMaxPrecipitation
      });
      
    } catch (err) {
      console.error('Error al obtener datos del clima:', err);
      setError('No se pudo cargar la información del clima');
    } finally {
      setLoading(false);
    }
  };
  
  // No mostrar el componente si se ocultó o está cargando sin datos previos
  if (!showAlert || (loading && !weatherData)) {
    return null;
  }
  
  // Mostrar un mensaje de error si falla la obtención de datos
  if (error && !weatherData) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => fetchWeatherData()}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }
  
  // Si no hay datos aún, no mostramos nada
  if (!weatherData) return null;
  
  // Determinar si se necesita sombrilla (probabilidad > 40%)
  const needsUmbrella = weatherData.precipitationProbability > 40 || weatherData.nextHoursMaxPrecipitation > 60;
  
  // Seleccionar color y mensaje según probabilidad
  let backgroundColor = '#3498db'; // Azul para clima normal
  let message = 'Clima estable';
  let icon = 'sunny';
  
  if (weatherData.precipitationProbability >= 70) {
    backgroundColor = '#e74c3c'; // Rojo para alta probabilidad
    message = '¡Lluvia inminente! Lleva sombrilla';
    icon = 'rainy';
  } else if (weatherData.precipitationProbability >= 40) {
    backgroundColor = '#f39c12'; // Naranja para probabilidad media
    message = 'Posible lluvia. Considera llevar sombrilla';
    icon = 'umbrella';
  } else if (weatherData.nextHoursMaxPrecipitation >= 60) {
    backgroundColor = '#f39c12'; // Naranja para probabilidad alta en próximas horas
    message = 'Lluvia en las próximas horas. Lleva sombrilla';
    icon = 'umbrella';
  }
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.content}>
        <Ionicons name={icon} size={20} color="#fff" style={styles.icon} />
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.temp}>{weatherData.currentTemp}°C</Text>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={() => setShowAlert(false)}>
        <Ionicons name="close" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  temp: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  closeButton: {
    padding: 5,
  },
  errorContainer: {
    backgroundColor: '#d9534f',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    marginRight: 10,
  },
});

export default WeatherAlert;