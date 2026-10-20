import { useEffect, useMemo, useState } from "react";
import {
  AdvancedMarker,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";

function TripMapContent({ userLocation, pickupLoc, dropLoc, driverLocation }) {
  const map = useMap();
  const [route, setRoute] = useState({ key: "", path: [] });
  const routeKey = [
    pickupLoc?.lat,
    pickupLoc?.lng,
    dropLoc?.lat,
    dropLoc?.lng,
  ].join(":");
  const routePath = useMemo(
    () => (route.key === routeKey ? route.path : []),
    [route.key, route.path, routeKey]
  );

  useEffect(() => {
    if (
      !pickupLoc ||
      !dropLoc ||
      !Number.isFinite(pickupLoc.lat) ||
      !Number.isFinite(pickupLoc.lng) ||
      !Number.isFinite(dropLoc.lat) ||
      !Number.isFinite(dropLoc.lng)
    ) {
      return;
    }

    const controller = new AbortController();
    async function fetchRoute() {
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${pickupLoc.lng},${pickupLoc.lat};${dropLoc.lng},${dropLoc.lat}` +
          "?overview=full&geometries=geojson";
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Route request failed");
        const data = await response.json();
        if (data.code !== "Ok" || !data.routes?.length) {
          throw new Error("No road route found");
        }
        setRoute({
          key: routeKey,
          path: data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Could not fetch road route:", error);
          setRoute({ key: routeKey, path: [] });
        }
      }
    }

    fetchRoute();
    return () => controller.abort();
  }, [pickupLoc, dropLoc, routeKey]);

  useEffect(() => {
    const maps = window.google?.maps;
    if (!map || !maps || routePath.length === 0) return;

    const polyline = new maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: "#4fb47a",
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map,
    });
    return () => polyline.setMap(null);
  }, [map, routePath]);

  useEffect(() => {
    const maps = window.google?.maps;
    if (!map || !maps) return;

    const locations = [
      ...(routePath.length ? routePath : [pickupLoc, dropLoc].filter(Boolean)),
    ].filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));

    if (locations.length >= 2) {
      const bounds = new maps.LatLngBounds();
      locations.forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, 60);
    } else if (locations.length === 1) {
      map.panTo(locations[0]);
      map.setZoom(15);
    } else if (userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    }
  }, [map, pickupLoc, dropLoc, routePath, userLocation]);

  return (
    <>
      {pickupLoc && <AdvancedMarker position={pickupLoc}><Pin background="#218653" borderColor="#ffffff" glyphColor="#ffffff" glyph="P" /></AdvancedMarker>}
      {dropLoc && <AdvancedMarker position={dropLoc}><Pin background="#cf795d" borderColor="#ffffff" glyphColor="#ffffff" glyph="D" /></AdvancedMarker>}
      {driverLocation && <AdvancedMarker position={driverLocation}><Pin background="#84c99a" borderColor="#ffffff" glyphColor="#10241b" glyph="C" /></AdvancedMarker>}
    </>
  );
}

export default function RideMap({ userLocation, pickupLoc, dropLoc, driverLocation }) {
  return (
    <Map
      mapId="DEMO_MAP_ID"
      style={{ width: "100%", height: "100%" }}
      defaultCenter={{ lat: 27.9, lng: 78.08 }}
      defaultZoom={13}
      gestureHandling="greedy"
      disableDefaultUI
    >
      <TripMapContent
        userLocation={userLocation}
        pickupLoc={pickupLoc}
        dropLoc={dropLoc}
        driverLocation={driverLocation}
      />
    </Map>
  );
}
