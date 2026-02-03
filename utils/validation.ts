// Phone number validation by country
export const COUNTRY_CODES = [
  { code: '+91', country: 'India', minLength: 10, maxLength: 10 },
  { code: '+1', country: 'USA/Canada', minLength: 10, maxLength: 10 },
  { code: '+44', country: 'UK', minLength: 10, maxLength: 10 },
  { code: '+971', country: 'UAE', minLength: 9, maxLength: 9 },
  { code: '+65', country: 'Singapore', minLength: 8, maxLength: 8 },
  { code: '+60', country: 'Malaysia', minLength: 9, maxLength: 10 },
  { code: '+61', country: 'Australia', minLength: 9, maxLength: 9 },
];

export const DEFAULT_COUNTRY_CODE = '+91';

export const validatePhoneNumber = (phone: string, countryCode: string): { valid: boolean; error?: string } => {
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  if (!country) {
    return { valid: false, error: 'Invalid country code' };
  }

  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < country.minLength) {
    return { valid: false, error: `Phone number must be at least ${country.minLength} digits` };
  }
  
  if (cleanPhone.length > country.maxLength) {
    return { valid: false, error: `Phone number must be at most ${country.maxLength} digits` };
  }

  return { valid: true };
};

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Date formatting utilities
export const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const parseDateFromDDMMYYYY = (dateStr: string): Date | null => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  
  return date;
};

export const isValidDateFormat = (dateStr: string): boolean => {
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = parseDateFromDDMMYYYY(dateStr);
  return date !== null;
};

// Distance calculation (approximate using Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const toRad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// City coordinates for distance calculation
export const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Delhi': { lat: 28.6139, lon: 77.2090 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'Jaipur': { lat: 26.9124, lon: 75.7873 },
  'Patna': { lat: 25.5941, lon: 85.1376 },
  'Lucknow': { lat: 26.8467, lon: 80.9462 },
  'Chandigarh': { lat: 30.7333, lon: 76.7794 },
};

export const getDistanceBetweenCities = (city1: string, city2: string): number | null => {
  const coords1 = CITY_COORDINATES[city1];
  const coords2 = CITY_COORDINATES[city2];
  
  if (!coords1 || !coords2) return null;
  
  return calculateDistance(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
};
