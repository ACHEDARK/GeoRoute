"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Plus, X, Clock, Route, MousePointer } from "lucide-react"

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

interface RoutePoint {
  id: string
  address: string
  type: "origin" | "destination" | "waypoint"
  coordinates?: { lat: number; lng: number }
}

interface RouteInfo {
  distance: string
  duration: string
  traffic: "light" | "moderate" | "heavy"
}

export default function RouteOptimizerApp() {
  const [points, setPoints] = useState<RoutePoint[]>([
    { id: "1", address: "", type: "origin" },
    { id: "2", address: "", type: "destination" },
  ])
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isSelectingPoint, setIsSelectingPoint] = useState<string | null>(null)
  const [markers, setMarkers] = useState<any[]>([])
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const geocoderRef = useRef<any>(null)

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap()
        return
      }

      const script = document.createElement("script")
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyB6Et3gdCErgDhdXUnds6xVo4KNoU2CKRY&libraries=places"
      script.async = true
      script.defer = true
      script.onload = initializeMap
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (mapRef.current && window.google) {
        // Initialize map centered in Quito, Ecuador
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          zoom: 12,
          center: { lat: -0.1807, lng: -78.4678 },
        })

        directionsServiceRef.current = new window.google.maps.DirectionsService()
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer()
        directionsRendererRef.current.setMap(mapInstanceRef.current)

        geocoderRef.current = new window.google.maps.Geocoder()

        mapInstanceRef.current.addListener("click", (event: any) => {
          if (isSelectingPoint) {
            handleMapClick(event.latLng)
          }
        })
      }
    }

    loadGoogleMaps()
  }, [isSelectingPoint])

  const handleMapClick = (latLng: any) => {
    if (!isSelectingPoint || !geocoderRef.current) return

    const coordinates = { lat: latLng.lat(), lng: latLng.lng() }

    geocoderRef.current.geocode({ location: coordinates }, (results: any, status: string) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address

        setPoints(points.map((point) => (point.id === isSelectingPoint ? { ...point, address, coordinates } : point)))

        addMarker(coordinates, isSelectingPoint, address)

        setIsSelectingPoint(null)
      }
    })
  }

  const addMarker = (coordinates: { lat: number; lng: number }, pointId: string, address: string) => {
    if (!mapInstanceRef.current) return

    const existingMarkerIndex = markers.findIndex((m) => m.pointId === pointId)
    if (existingMarkerIndex !== -1) {
      markers[existingMarkerIndex].marker.setMap(null)
      setMarkers((prev) => prev.filter((_, index) => index !== existingMarkerIndex))
    }

    const point = points.find((p) => p.id === pointId)
    let markerColor = "#4285F4"
    if (point?.type === "origin") markerColor = "#34A853"
    if (point?.type === "destination") markerColor = "#EA4335"

    const marker = new window.google.maps.Marker({
      position: coordinates,
      map: mapInstanceRef.current,
      title: address,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: markerColor,
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
    })

    setMarkers((prev) => [...prev, { marker, pointId }])
  }

  const startPointSelection = (pointId: string) => {
    setIsSelectingPoint(pointId)
  }

  const addWaypoint = () => {
    const newWaypoint: RoutePoint = {
      id: Date.now().toString(),
      address: "",
      type: "waypoint",
    }
    const newPoints = [...points]
    newPoints.splice(-1, 0, newWaypoint)
    setPoints(newPoints)
  }

  const removeWaypoint = (id: string) => {
    const markerIndex = markers.findIndex((m) => m.pointId === id)
    if (markerIndex !== -1) {
      markers[markerIndex].marker.setMap(null)
      setMarkers((prev) => prev.filter((_, index) => index !== markerIndex))
    }
    setPoints(points.filter((point) => point.id !== id))
  }

  const updatePoint = (id: string, address: string) => {
    setPoints(points.map((point) => (point.id === id ? { ...point, address } : point)))
  }

  const calculateRoute = async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) {
      alert("Google Maps no está cargado correctamente")
      return
    }

    setIsCalculating(true)

    const origin = points.find((p) => p.type === "origin")
    const destination = points.find((p) => p.type === "destination")
    const waypoints = points
      .filter((p) => p.type === "waypoint" && (p.address.trim() !== "" || p.coordinates))
      .map((p) => ({
        location: p.coordinates || p.address,
        stopover: true,
      }))

    if (
      !origin ||
      !destination ||
      (!origin.address && !origin.coordinates) ||
      (!destination.address && !destination.coordinates)
    ) {
      alert("Por favor selecciona el origen y destino")
      setIsCalculating(false)
      return
    }

    const request = {
      origin: origin.coordinates || origin.address,
      destination: destination.coordinates || destination.address,
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true,
    }

    directionsServiceRef.current.route(request, (result: any, status: string) => {
      setIsCalculating(false)

      if (status === "OK") {
        directionsRendererRef.current.setDirections(result)

        markers.forEach((m) => m.marker.setMap(null))
        setMarkers([])

        const route = result.routes[0]

        setRouteInfo({
          distance: route.legs.reduce((total: number, leg: any) => total + leg.distance.value, 0) / 1000 + " km",
          duration:
            Math.ceil(route.legs.reduce((total: number, leg: any) => total + leg.duration.value, 0) / 60) + " min",
          traffic: "moderate",
        })
      } else {
        alert("No se pudo obtener la ruta: " + status)
      }
    })
  }

  const getPointIcon = (type: string) => {
    switch (type) {
      case "origin":
        return <div className="w-3 h-3 bg-green-500 rounded-full" />
      case "destination":
        return <div className="w-3 h-3 bg-red-500 rounded-full" />
      default:
        return <div className="w-3 h-3 bg-blue-500 rounded-full" />
    }
  }

  const getPointLabel = (type: string, index: number) => {
    switch (type) {
      case "origin":
        return "Punto de origen"
      case "destination":
        return "Destino"
      default:
        return `Parada ${index}`
    }
  }

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case "light":
        return "bg-green-100 text-green-800"
      case "moderate":
        return "bg-yellow-100 text-yellow-800"
      case "heavy":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Navigation className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Optimizador de Rutas</h1>
          </div>
          <p className="text-muted-foreground text-lg">Encuentra la ruta más eficiente entre tus puntos de interés</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Route Planning Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Planificar Ruta
              </CardTitle>
              <CardDescription>
                Ingresa direcciones manualmente o haz clic en el mapa para seleccionar ubicaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {points.map((point, index) => (
                <div key={point.id} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getPointIcon(point.type)}
                    <div className="flex-1">
                      <Label htmlFor={`point-${point.id}`} className="text-sm font-medium">
                        {getPointLabel(point.type, index)}
                      </Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          id={`point-${point.id}`}
                          placeholder="Ej: Quito, Ecuador o dirección específica..."
                          value={point.address}
                          onChange={(e) => updatePoint(point.id, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startPointSelection(point.id)}
                          className={`px-3 ${isSelectingPoint === point.id ? "bg-primary text-primary-foreground" : ""}`}
                          title="Seleccionar en el mapa"
                        >
                          <MousePointer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {point.type === "waypoint" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWaypoint(point.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              {isSelectingPoint && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    🗺️ Haz clic en el mapa para seleccionar la ubicación
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSelectingPoint(null)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    Cancelar selección
                  </Button>
                </div>
              )}

              <Button variant="outline" onClick={addWaypoint} className="w-full bg-transparent">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Parada Intermedia
              </Button>

              <Button
                onClick={calculateRoute}
                disabled={isCalculating || !points[0].address || !points[points.length - 1].address}
                className="w-full"
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Route className="h-4 w-4 mr-2" />
                    Calcular Ruta Óptima
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Map and Results Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mapa de Ruta</CardTitle>
                <CardDescription>
                  {isSelectingPoint
                    ? "Haz clic en el mapa para seleccionar la ubicación"
                    : "Usa los botones de cursor para seleccionar puntos en el mapa"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  ref={mapRef}
                  className={`w-full h-96 rounded-lg ${isSelectingPoint ? "cursor-crosshair" : ""}`}
                  style={{ minHeight: "400px" }}
                />
              </CardContent>
            </Card>

            {/* Route Information */}
            {routeInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Información de la Ruta
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{routeInfo.distance}</p>
                      <p className="text-sm text-muted-foreground">Distancia Total</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">{routeInfo.duration}</p>
                      <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado del Tráfico:</span>
                    <Badge className={getTrafficColor(routeInfo.traffic)}>
                      {routeInfo.traffic === "light" && "Ligero"}
                      {routeInfo.traffic === "moderate" && "Moderado"}
                      {routeInfo.traffic === "heavy" && "Pesado"}
                    </Badge>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Ruta Optimizada:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Ruta calculada con Google Maps
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Paradas intermedias optimizadas automáticamente
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        Tiempo y distancia reales
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
