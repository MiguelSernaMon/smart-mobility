import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, Text, Button } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ConfirmRouteScreen() {
  // Estados para manejar la ubicación y errores
  const [userLocation, setUserLocation] = useState({ lat: 4.7110, lng: -74.0721 }); // Ubicación por defecto
  const [locationError, setLocationError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Función para obtener la ubicación del usuario
  const getCurrentLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setIsLocating(false);
        },
        (error) => {
          console.error('Error al obtener la ubicación:', error);
          setLocationError(`Error: ${error.message}`);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } else {
      setLocationError('Tu navegador no soporta geolocalización');
      setIsLocating(false);
    }
  };
  
  // Generar HTML del mapa con la ubicación dinámica
  const getLeafletMapHtml = () => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100%; }
            .location-button {
              position: absolute;
              bottom: 20px;
              right: 20px;
              z-index: 1000;
              padding: 10px;
              background: white;
              border: 1px solid #ccc;
              border-radius: 4px;
              cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Inicializar el mapa con la ubicación del usuario
                const map = L.map('map').setView([${userLocation.lat}, ${userLocation.lng}], 15);
                
                // Añadir capa de mapa
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
                
                // Añadir marcador en la ubicación del usuario
                const marker = L.marker([${userLocation.lat}, ${userLocation.lng}])
                    .addTo(map)
                    .bindPopup('Tu ubicación actual')
                    .openPopup();
                
                // Añadir círculo para mostrar el radio aproximado
                L.circle([${userLocation.lat}, ${userLocation.lng}], {
                    color: 'blue',
                    fillColor: '#3388ff',
                    fillOpacity: 0.2,
                    radius: 100
                }).addTo(map);
                
                // Agregar botón para centrar el mapa
                const centerButton = document.createElement('button');
                centerButton.innerHTML = 'Centrar mapa';
                centerButton.className = 'location-button';
                centerButton.onclick = function() {
                    map.setView([${userLocation.lat}, ${userLocation.lng}], 15);
                };
                document.body.appendChild(centerButton);
            });
        </script>
    </body>
    </html>
  `;

  // Función para comunicarse con WebView en dispositivos móviles
  const updateLocationInWebView = (webViewRef) => {
    if (webViewRef && Platform.OS !== 'web') {
      const jsCode = `
        const map = window.map;
        if (map) {
          map.setView([${userLocation.lat}, ${userLocation.lng}], 15);
          
          // Actualizar marcador
          if (window.marker) {
            window.marker.setLatLng([${userLocation.lat}, ${userLocation.lng}]);
          } else {
            window.marker = L.marker([${userLocation.lat}, ${userLocation.lng}])
              .addTo(map)
              .bindPopup('Tu ubicación actual')
              .openPopup();
          }
        }
      `;
      webViewRef.injectJavaScript(jsCode);
    }
  };

  // WebView ref para manipular el mapa en móvil
  const webViewRef = React.useRef(null);
  
  // Efecto para actualizar el mapa móvil cuando cambia la ubicación
  useEffect(() => {
    if (webViewRef.current && Platform.OS !== 'web') {
      updateLocationInWebView(webViewRef.current);
    }
  }, [userLocation]);

  // Componente de control para web
  const LocationControls = () => (
    <View style={styles.controls}>
      <Button
        title={isLocating ? "Obteniendo ubicación..." : "Obtener mi ubicación"}
        onPress={getCurrentLocation}
        disabled={isLocating}
      />
      {locationError && (
        <Text style={styles.errorText}>{locationError}</Text>
      )}
    </View>
  );

  // Renderizado para web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <LocationControls />
        <iframe 
          title="Mapa"
          srcDoc={getLeafletMapHtml()}
          style={{
            border: 'none',
            width: '100%',
            height: '85%',
            borderRadius: '8px'
          }}
        />
      </View>
    );
  }

  // Para dispositivos móviles, usa WebView con comunicación JS
  return (
    <View style={styles.container}>
      <LocationControls />
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: getLeafletMapHtml() }}
        style={styles.webview}
        geolocationEnabled={true} // Habilitar geolocalización en WebView
        onMessage={(event) => {
          // Manejar mensajes desde WebView si es necesario
          console.log(event.nativeEvent.data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  webview: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden'
  },
  controls: {
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  }
});