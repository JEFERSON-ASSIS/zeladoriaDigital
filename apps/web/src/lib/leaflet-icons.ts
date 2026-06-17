export function createCenterPinIcon(L: typeof import('leaflet')) {
  return L.divIcon({
    className: 'map-pin-icon map-pin-icon--center',
    html: '<span class="map-pin-icon__dot"></span><span class="map-pin-icon__stem"></span>',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -32]
  });
}

export function createOccurrencePinIcon(L: typeof import('leaflet'), color = '#2563eb') {
  return L.divIcon({
    className: 'map-pin-icon map-pin-icon--occurrence',
    html: `<span class="map-pin-icon__dot" style="background:${color}"></span><span class="map-pin-icon__stem" style="background:${color}"></span>`,
    iconSize: [22, 32],
    iconAnchor: [11, 32],
    popupAnchor: [0, -28]
  });
}
