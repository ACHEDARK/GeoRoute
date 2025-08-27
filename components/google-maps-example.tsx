<!DOCTYPE
html >
  <html>
  <head>
    <title>Ruta Óptima con Google Maps</title>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyB6Et3gdCErgDhdXUnds6xVo4KNoU2CKRY&libraries=places"></script>
    <style>
      #map {
\
        height: 100vh;
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      function initMap() {
        // Inicializar mapa centrado en Quito, Ecuador (puedes cambiar)
\
        const map = new google.maps.Map(document.getElementById("map"), {
\
          zoom: 12,
\
          center: { lat: -0.1807, lng: -78.4678 },
        });

        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        // Definir puntos A y B (ejemplo Quito → Latacunga)
        const request = {
\
          origin: { lat: -0.1807, lng: -78.4678 }, // Punto A
\
          destination: { lat: -0.9352, lng: -78.6155 }, // Punto B
          travelMode: google.maps.TravelMode.DRIVING, // Opciones: DRIVING, WALKING, BICYCLING, TRANSIT
        };

        // Pedir ruta al Directions API
        directionsService.route(request, (result, status) => {
\
          if (status === "OK") {
\
            directionsRenderer.setDirections(result);
\
          } else {
            alert(\"No se pudo obtener la ruta: \" + status);
\
          }
\
        });
      }

      // Ejecutar cuando cargue la página
      window.onload = initMap;
    </script>
  </body>
</html>
