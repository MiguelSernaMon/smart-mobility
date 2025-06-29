# Debug del Sistema de Reportes

## Pasos para probar:

1. **Abrir la aplicación**
2. **Verificar que aparezcan 2 reportes quemados en el debug panel**
3. **Presionar el botón "Agregar Reporte Prueba" y ver si el contador aumenta**
4. **Verificar en los logs de la consola que los reportes se están renderizando**
5. **Buscar en el mapa los marcadores de reportes**

## Marcadores esperados:

### Reportes quemados:
- **Reporte 1**: "Escalón dañado" en (6.254565, -75.572568) - Categoría: accessibility (naranja)
- **Reporte 2**: "Semáforo sin sonido" en (6.270373, -75.567537) - Categoría: safety (rojo)

### Reportes de prueba:
- **Reporte de prueba**: "Reporte de prueba" en (6.255000, -75.573000) - Categoría: safety (rojo)

## Colores por categoría:
- **accessibility**: #FF6B35 (naranja)
- **safety**: #FF3B30 (rojo)
- **infrastructure**: #FF9500 (amarillo)
- **transport**: #007AFF (azul)
- **other**: #8E8E93 (gris)

## Iconos por categoría:
- **accessibility**: accessibility
- **safety**: warning
- **infrastructure**: construct
- **transport**: bus
- **other**: help-circle

## Posibles problemas:
1. Los marcadores están en coordenadas fuera del viewport actual
2. Los marcadores están siendo renderizados pero con z-index bajo
3. Los estilos del marcador no se están aplicando correctamente
4. Hay un problema con el key del marcador causando que no se actualice
