export const PILOT_CONFIG = {
  INTRA_CITY_ONLY: true,
  ALLOWED_CITIES: ['Bangalore', 'Bengaluru'] as string[],
  MAX_PARCEL_VALUE_INR: 10000,
} as const;

export function isPilotCity(city: string | undefined): boolean {
  if (!city) return false;
  const normalized = city.trim().toLowerCase();
  return PILOT_CONFIG.ALLOWED_CITIES.some(c => c.toLowerCase() === normalized);
}

export function isIntraCityAllowed(pickup: string, destination: string): boolean {
  if (!pickup || !destination) return false;
  return pickup.trim().toLowerCase() === destination.trim().toLowerCase();
}
