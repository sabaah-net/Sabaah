const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export interface OverpassNode {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export async function queryNearbyCafes(lat: number, lon: number, radius = 2000): Promise<OverpassNode[]> {
  const query = `
    [out:json];
    (
      node["amenity"="cafe"](around:${radius},${lat},${lon});
      node["shop"="coffee"](around:${radius},${lat},${lon});
    );
    out body;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const data = await res.json();
  return data.elements || [];
}

export function getCityBounds(city: string): { lat: number; lon: number } {
  const cities: Record<string, { lat: number; lon: number }> = {
    riyadh: { lat: 24.7136, lon: 46.6753 },
    jeddah: { lat: 21.4858, lon: 39.1925 },
    dammam: { lat: 26.4207, lon: 50.0888 },
    mecca: { lat: 21.3891, lon: 39.8579 },
  };
  return cities[city] || cities.riyadh;
}
