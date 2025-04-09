import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ConfirmRouteScreen() {
  // Si estamos en web o en un entorno sin SDK de Android
  // mostramos un mapa básico con Leaflet en WebView
  
  // HTML con Leaflet incorporado
  const leafletMapHtml = `
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
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                // Inicializar el mapa
                const map = L.map('map').setView([4.7110, -74.0721], 13);
                
                // Añadir capa de mapa
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);
                
                // Añadir marcador
                L.marker([4.7110, -74.0721])
                    .addTo(map)
                    .bindPopup('Ubicación actual')
                    .openPopup();
            });
        </script>
    </body>
    </html>
  `;

  // Verifica si estamos en un entorno web
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <iframe 
          title="Mapa"
          srcDoc={leafletMapHtml}
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
            borderRadius: '8px'
          }}
        />
      </View>
    );
  }

  // Para dispositivos móviles, usa WebView
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: leafletMapHtml }}
        style={styles.webview}
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
  }
});