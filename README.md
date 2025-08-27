# Optimizador de Rutas

Aplicación web en Next.js que permite planificar rutas con Google Maps, agregando origen, destino y paradas intermedias. Incluye autocompletado de lugares, selección directa en el mapa, botón de "Mi ubicación" y cálculo de rutas optimizadas (Auto y A pie).

## Características

- Autocompletado de direcciones con Google Places en los campos de entrada.
- Selección de puntos haciendo clic directamente en el mapa.
- Marcadores de colores por tipo de punto (origen, destino, parada).
- Cálculo de ruta optimizada (reordena paradas) usando Google Maps Directions.
- Modo de viaje: Auto y A pie.
- Botón "Mi ubicación" para centrar el mapa y marcar tu posición actual.
- UI moderna basada en componentes (`shadcn/ui`) y `lucide-react` para iconos.

## Requisitos

- Node.js 18+
- Una clave de Google Maps JavaScript API con la librería Places habilitada.
  - Servicios usados: Maps JavaScript API, Places API, Directions API.

## Configuración de la clave de Google Maps

La clave se lee desde variables de entorno.

1. Crea un archivo `.env.local` en la raíz del proyecto.
2. Agrega tu API key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TU_API_KEY
```

Recomendado: restringe la clave por dominios (HTTP referrers) desde Google Cloud Console.

## Instalación y ejecución

```bash
npm install
npm run dev
# abre http://localhost:3000
```

Build de producción:
```bash
npm run build
npm run start
```

## Uso

1. Ingresa el origen y destino en los campos (tienen autocompletado).
2. Opcional: agrega paradas intermedias con el botón "Agregar Parada Intermedia".
3. Alterna el modo de viaje entre Auto y A pie.
4. También puedes seleccionar cualquier punto haciendo clic en el mapa (usa el botón de cursor junto a cada campo para indicar qué punto vas a seleccionar).
5. Usa "Mi ubicación" para centrar el mapa en tu posición (requiere permisos del navegador).
6. Presiona "Calcular Ruta Óptima" para trazar y optimizar la ruta.

La tarjeta de resultados muestra la distancia total y el tiempo estimado, además de una breve leyenda de cómo se calculó.

## Estructura del proyecto (relevante)

- `app/page.tsx`: interfaz y lógica principal del mapa, inputs, cálculo de ruta y UI.
- `components/ui/*`: componentes reutilizables de la UI (botones, inputs, tarjetas, etc.).
- `components/ui/input.tsx`: input con `forwardRef` para integrar Autocomplete.
- `app/layout.tsx` y `app/globals.css`: layout y estilos globales.

## Tecnologías

- Next.js (App Router)
- Google Maps JavaScript API + Places + Directions
- React + TypeScript
- Tailwind CSS + componentes `shadcn/ui`
- Iconos `lucide-react`

## Notas y limitaciones

- Asegúrate de tener cuotas suficientes en Google Cloud para Maps/Places/Directions.
- La optimización de paradas es realizada por Directions API cuando se indica `optimizeWaypoints`.
- La geolocalización depende de permisos del navegador.

## Licencia

Uso académico/educativo. Ajusta según tus necesidades.
