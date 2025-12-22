import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Route, Clock, RefreshCw } from 'lucide-react';
import { getBookingRouteHistory, getRouteStats, RoutePoint } from '@/services/routeHistoryService';
import { format } from 'date-fns';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface RouteHistoryViewerProps {
  bookingId: string;
  mapboxToken?: string;
}

export const RouteHistoryViewer: React.FC<RouteHistoryViewerProps> = ({ 
  bookingId,
  mapboxToken 
}) => {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [stats, setStats] = useState<{
    totalPoints: number;
    startTime: string | null;
    endTime: string | null;
    durationMinutes: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const fetchRouteData = async () => {
    setLoading(true);
    const [points, routeStats] = await Promise.all([
      getBookingRouteHistory(bookingId),
      getRouteStats(bookingId)
    ]);
    setRoutePoints(points);
    setStats(routeStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchRouteData();
  }, [bookingId]);

  // Initialize map when we have route data and token
  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || routePoints.length < 2 || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = mapboxToken;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [routePoints[0].longitude, routePoints[0].latitude],
      zoom: 13
    });

    mapRef.current = map;

    map.on('load', () => {
      // Add route line
      const coordinates = routePoints.map(p => [p.longitude, p.latitude]);
      
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates
          }
        }
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4
        }
      });

      // Add start marker
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat([routePoints[0].longitude, routePoints[0].latitude])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Start</strong>'))
        .addTo(map);

      // Add end marker
      const lastPoint = routePoints[routePoints.length - 1];
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([lastPoint.longitude, lastPoint.latitude])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>End</strong>'))
        .addTo(map);

      // Fit bounds to route
      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(coord => bounds.extend(coord as [number, number]));
      map.fitBounds(bounds, { padding: 50 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [routePoints, mapboxToken]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading route history...</p>
        </CardContent>
      </Card>
    );
  }

  if (routePoints.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Route className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No route history available for this booking</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Driver Route History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRouteData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Points Recorded
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalPoints}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duration
              </div>
              <p className="text-2xl font-bold mt-1">{stats.durationMinutes} min</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Route className="h-4 w-4" />
                Status
              </div>
              <Badge className="mt-1">Complete</Badge>
            </div>
          </div>
        )}

        {/* Map */}
        {mapboxToken && (
          <div 
            ref={mapContainerRef} 
            className="w-full h-[300px] rounded-lg overflow-hidden border"
          />
        )}

        {/* Timeline */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Trip Timeline
          </h4>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="bg-green-500/10 text-green-600">Start</Badge>
            <span>
              {stats?.startTime && format(new Date(stats.startTime), 'MMM dd, yyyy HH:mm:ss')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="bg-red-500/10 text-red-600">End</Badge>
            <span>
              {stats?.endTime && format(new Date(stats.endTime), 'MMM dd, yyyy HH:mm:ss')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteHistoryViewer;
