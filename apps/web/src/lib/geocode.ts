export async function geocodeAddress(
  address: string,
  municipio?: string,
  estado?: string
): Promise<{ latitude: number; longitude: number } | null> {
  const parts = [address.trim(), municipio?.trim(), estado?.trim(), 'Brasil'].filter(Boolean);
  if (!address.trim()) return null;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(parts.join(', '))}`,
    { headers: { 'Accept-Language': 'pt-BR' } }
  );

  if (!response.ok) return null;

  const results = (await response.json()) as Array<{ lat: string; lon: string }>;
  if (!results[0]) return null;

  return {
    latitude: Number(results[0].lat),
    longitude: Number(results[0].lon)
  };
}
