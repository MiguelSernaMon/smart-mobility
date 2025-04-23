/**
 * Decodifica una polyline codificada de Google Maps a un array de coordenadas.
 * @param encoded - La polyline codificada
 * @returns Un array de objetos con coordenadas {latitude, longitude}
 */
export const decodePolyline = (encoded: string) => {
    if (!encoded) return [];
    
    let index = 0, lat = 0, lng = 0;
    const points = [];
    const len = encoded.length;
    
    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;
      
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      
      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;
      
      const latitude = lat * 1e-5;
      const longitude = lng * 1e-5;
      points.push({ latitude, longitude });
    }
    
    return points;
  };