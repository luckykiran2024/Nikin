import { City, Quote, Shipment, TravelRoute, User } from '@/types';

export const cities: City[] = [
  { id: '1', name: 'Mumbai', state: 'Maharashtra' },
  { id: '2', name: 'Delhi', state: 'Delhi' },
  { id: '3', name: 'Bangalore', state: 'Karnataka' },
  { id: '4', name: 'Hyderabad', state: 'Telangana' },
  { id: '5', name: 'Chennai', state: 'Tamil Nadu' },
  { id: '6', name: 'Kolkata', state: 'West Bengal' },
  { id: '7', name: 'Pune', state: 'Maharashtra' },
  { id: '8', name: 'Ahmedabad', state: 'Gujarat' },
  { id: '9', name: 'Jaipur', state: 'Rajasthan' },
  { id: '10', name: 'Patna', state: 'Bihar' },
  { id: '11', name: 'Lucknow', state: 'Uttar Pradesh' },
  { id: '12', name: 'Chandigarh', state: 'Punjab' },
];

export const mockUser: User | null = null;

export const mockShipments: Shipment[] = [];

export const mockTravelRoutes: TravelRoute[] = [];

export const mockQuotes: Quote[] = [];

export const availableShipmentsForTravelers: Shipment[] = [];

export const parcelCategories = [
  'Electronics',
  'Documents',
  'Clothing',
  'Books',
  'Gifts',
  'Food Items',
  'Medicine',
  'Jewelry',
  'Sports Equipment',
  'Home Decor',
  'Others',
];
