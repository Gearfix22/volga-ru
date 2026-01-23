/**
 * SmoothMarker Utility
 * Animates marker movement for smooth tracking experience
 */

import mapboxgl from 'mapbox-gl';

export interface SmoothMarkerOptions {
  duration?: number; // Animation duration in ms
  easing?: (t: number) => number;
}

const defaultEasing = (t: number): number => {
  // Ease out cubic
  return 1 - Math.pow(1 - t, 3);
};

export class SmoothMarker {
  private marker: mapboxgl.Marker;
  private animationFrame: number | null = null;
  private currentLngLat: [number, number];
  
  constructor(marker: mapboxgl.Marker) {
    this.marker = marker;
    const lngLat = marker.getLngLat();
    this.currentLngLat = [lngLat.lng, lngLat.lat];
  }

  animateTo(
    targetLng: number, 
    targetLat: number, 
    options: SmoothMarkerOptions = {}
  ): void {
    const { duration = 1000, easing = defaultEasing } = options;
    
    // Cancel any ongoing animation
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    const startLngLat = [...this.currentLngLat] as [number, number];
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      const lng = startLngLat[0] + (targetLng - startLngLat[0]) * easedProgress;
      const lat = startLngLat[1] + (targetLat - startLngLat[1]) * easedProgress;

      this.marker.setLngLat([lng, lat]);
      this.currentLngLat = [lng, lat];

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  setRotation(heading: number): void {
    const el = this.marker.getElement();
    if (el) {
      el.style.transform = `rotate(${heading}deg)`;
    }
  }

  getMarker(): mapboxgl.Marker {
    return this.marker;
  }

  remove(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.marker.remove();
  }
}

/**
 * Updates or creates a route polyline on the map
 */
export const updateRoutePolyline = (
  map: mapboxgl.Map,
  sourceId: string,
  coordinates: [number, number][]
): void => {
  const source = map.getSource(sourceId) as mapboxgl.GeoJSONSource;
  
  if (source) {
    source.setData({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates,
      },
    });
  } else {
    // Add source and layer if they don't exist
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    });

    map.addLayer({
      id: `${sourceId}-layer`,
      type: 'line',
      source: sourceId,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': '#3b82f6', // primary blue
        'line-width': 4,
        'line-opacity': 0.8,
      },
    });
  }
};

/**
 * Creates a pulsing dot marker element
 */
export const createDriverMarkerElement = (isActive: boolean = true): HTMLElement => {
  const el = document.createElement('div');
  el.className = 'driver-marker-container';
  el.innerHTML = `
    <div class="relative">
      <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white ${isActive ? 'animate-pulse' : ''}">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
      ${isActive ? '<div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>' : ''}
      <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-primary"></div>
    </div>
  `;
  return el;
};

/**
 * Creates a destination marker element
 */
export const createDestinationMarkerElement = (): HTMLElement => {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg border-2 border-white">
      <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    </div>
  `;
  return el;
};

/**
 * Fit map bounds to show both driver and destination
 */
export const fitMapToRoute = (
  map: mapboxgl.Map,
  driverLngLat: [number, number],
  destinationLngLat: [number, number],
  padding: number = 80
): void => {
  const bounds = new mapboxgl.LngLatBounds();
  bounds.extend(driverLngLat);
  bounds.extend(destinationLngLat);
  
  map.fitBounds(bounds, {
    padding,
    maxZoom: 15,
    duration: 1000,
  });
};
