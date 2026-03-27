export interface IndianLocation {
  id: string;
  name: string;
  state: string;
  type: 'city' | 'town' | 'district';
  coordinates?: { lat: number; lng: number };
}

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Chandigarh',
  'Puducherry',
  'Andaman and Nicobar Islands',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
];

export const INDIAN_LOCATIONS: IndianLocation[] = [
  { id: '1', name: 'Mumbai', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.076, lng: 72.8777 } },
  { id: '2', name: 'Delhi', state: 'Delhi', type: 'city', coordinates: { lat: 28.6139, lng: 77.209 } },
  { id: '3', name: 'Bangalore', state: 'Karnataka', type: 'city', coordinates: { lat: 12.9716, lng: 77.5946 } },
  { id: '4', name: 'Hyderabad', state: 'Telangana', type: 'city', coordinates: { lat: 17.385, lng: 78.4867 } },
  { id: '5', name: 'Chennai', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 13.0827, lng: 80.2707 } },
  { id: '6', name: 'Kolkata', state: 'West Bengal', type: 'city', coordinates: { lat: 22.5726, lng: 88.3639 } },
  { id: '7', name: 'Pune', state: 'Maharashtra', type: 'city', coordinates: { lat: 18.5204, lng: 73.8567 } },
  { id: '8', name: 'Ahmedabad', state: 'Gujarat', type: 'city', coordinates: { lat: 23.0225, lng: 72.5714 } },
  { id: '9', name: 'Jaipur', state: 'Rajasthan', type: 'city', coordinates: { lat: 26.9124, lng: 75.7873 } },
  { id: '10', name: 'Surat', state: 'Gujarat', type: 'city', coordinates: { lat: 21.1702, lng: 72.8311 } },
  { id: '11', name: 'Lucknow', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 26.8467, lng: 80.9462 } },
  { id: '12', name: 'Kanpur', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 26.4499, lng: 80.3319 } },
  { id: '13', name: 'Nagpur', state: 'Maharashtra', type: 'city', coordinates: { lat: 21.1458, lng: 79.0882 } },
  { id: '14', name: 'Indore', state: 'Madhya Pradesh', type: 'city', coordinates: { lat: 22.7196, lng: 75.8577 } },
  { id: '15', name: 'Thane', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.2183, lng: 72.9781 } },
  { id: '16', name: 'Bhopal', state: 'Madhya Pradesh', type: 'city', coordinates: { lat: 23.2599, lng: 77.4126 } },
  { id: '17', name: 'Visakhapatnam', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 17.6868, lng: 83.2185 } },
  { id: '18', name: 'Patna', state: 'Bihar', type: 'city', coordinates: { lat: 25.5941, lng: 85.1376 } },
  { id: '19', name: 'Vadodara', state: 'Gujarat', type: 'city', coordinates: { lat: 22.3072, lng: 73.1812 } },
  { id: '20', name: 'Ghaziabad', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.6692, lng: 77.4538 } },
  { id: '21', name: 'Ludhiana', state: 'Punjab', type: 'city', coordinates: { lat: 30.901, lng: 75.8573 } },
  { id: '22', name: 'Agra', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 27.1767, lng: 78.0081 } },
  { id: '23', name: 'Nashik', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.9975, lng: 73.7898 } },
  { id: '24', name: 'Faridabad', state: 'Haryana', type: 'city', coordinates: { lat: 28.4089, lng: 77.3178 } },
  { id: '25', name: 'Meerut', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.9845, lng: 77.7064 } },
  { id: '26', name: 'Rajkot', state: 'Gujarat', type: 'city', coordinates: { lat: 22.3039, lng: 70.8022 } },
  { id: '27', name: 'Varanasi', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 25.3176, lng: 82.9739 } },
  { id: '28', name: 'Srinagar', state: 'Jammu and Kashmir', type: 'city', coordinates: { lat: 34.0837, lng: 74.7973 } },
  { id: '29', name: 'Aurangabad', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.8762, lng: 75.3433 } },
  { id: '30', name: 'Dhanbad', state: 'Jharkhand', type: 'city', coordinates: { lat: 23.7957, lng: 86.4304 } },
  { id: '31', name: 'Amritsar', state: 'Punjab', type: 'city', coordinates: { lat: 31.634, lng: 74.8723 } },
  { id: '32', name: 'Navi Mumbai', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.033, lng: 73.0297 } },
  { id: '33', name: 'Allahabad', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 25.4358, lng: 81.8463 } },
  { id: '34', name: 'Ranchi', state: 'Jharkhand', type: 'city', coordinates: { lat: 23.3441, lng: 85.3096 } },
  { id: '35', name: 'Howrah', state: 'West Bengal', type: 'city', coordinates: { lat: 22.5958, lng: 88.2636 } },
  { id: '36', name: 'Coimbatore', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 11.0168, lng: 76.9558 } },
  { id: '37', name: 'Jabalpur', state: 'Madhya Pradesh', type: 'city', coordinates: { lat: 23.1815, lng: 79.9864 } },
  { id: '38', name: 'Gwalior', state: 'Madhya Pradesh', type: 'city', coordinates: { lat: 26.2183, lng: 78.1828 } },
  { id: '39', name: 'Vijayawada', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 16.5062, lng: 80.648 } },
  { id: '40', name: 'Jodhpur', state: 'Rajasthan', type: 'city', coordinates: { lat: 26.2389, lng: 73.0243 } },
  { id: '41', name: 'Madurai', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 9.9252, lng: 78.1198 } },
  { id: '42', name: 'Raipur', state: 'Chhattisgarh', type: 'city', coordinates: { lat: 21.2514, lng: 81.6296 } },
  { id: '43', name: 'Kota', state: 'Rajasthan', type: 'city', coordinates: { lat: 25.2138, lng: 75.8648 } },
  { id: '44', name: 'Chandigarh', state: 'Chandigarh', type: 'city', coordinates: { lat: 30.7333, lng: 76.7794 } },
  { id: '45', name: 'Guwahati', state: 'Assam', type: 'city', coordinates: { lat: 26.1445, lng: 91.7362 } },
  { id: '46', name: 'Solapur', state: 'Maharashtra', type: 'city', coordinates: { lat: 17.6599, lng: 75.9064 } },
  { id: '47', name: 'Hubli', state: 'Karnataka', type: 'city', coordinates: { lat: 15.3647, lng: 75.124 } },
  { id: '48', name: 'Mysore', state: 'Karnataka', type: 'city', coordinates: { lat: 12.2958, lng: 76.6394 } },
  { id: '49', name: 'Tiruchirappalli', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 10.7905, lng: 78.7047 } },
  { id: '50', name: 'Bareilly', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.367, lng: 79.4304 } },
  { id: '51', name: 'Aligarh', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 27.8974, lng: 78.088 } },
  { id: '52', name: 'Tiruppur', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 11.1085, lng: 77.3411 } },
  { id: '53', name: 'Moradabad', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.8389, lng: 78.7769 } },
  { id: '54', name: 'Jalandhar', state: 'Punjab', type: 'city', coordinates: { lat: 31.326, lng: 75.5762 } },
  { id: '55', name: 'Bhubaneswar', state: 'Odisha', type: 'city', coordinates: { lat: 20.2961, lng: 85.8245 } },
  { id: '56', name: 'Salem', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 11.6643, lng: 78.146 } },
  { id: '57', name: 'Warangal', state: 'Telangana', type: 'city', coordinates: { lat: 17.9784, lng: 79.5941 } },
  { id: '58', name: 'Guntur', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 16.3067, lng: 80.4365 } },
  { id: '59', name: 'Bhiwandi', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.2967, lng: 73.0631 } },
  { id: '60', name: 'Saharanpur', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 29.9679, lng: 77.5456 } },
  { id: '61', name: 'Gorakhpur', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 26.7606, lng: 83.3732 } },
  { id: '62', name: 'Bikaner', state: 'Rajasthan', type: 'city', coordinates: { lat: 28.0229, lng: 73.3119 } },
  { id: '63', name: 'Amravati', state: 'Maharashtra', type: 'city', coordinates: { lat: 20.9374, lng: 77.7796 } },
  { id: '64', name: 'Noida', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.5355, lng: 77.391 } },
  { id: '65', name: 'Jamshedpur', state: 'Jharkhand', type: 'city', coordinates: { lat: 22.8046, lng: 86.2029 } },
  { id: '66', name: 'Bhilai', state: 'Chhattisgarh', type: 'city', coordinates: { lat: 21.2094, lng: 81.4285 } },
  { id: '67', name: 'Cuttack', state: 'Odisha', type: 'city', coordinates: { lat: 20.4625, lng: 85.8828 } },
  { id: '68', name: 'Firozabad', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 27.1591, lng: 78.3957 } },
  { id: '69', name: 'Kochi', state: 'Kerala', type: 'city', coordinates: { lat: 9.9312, lng: 76.2673 } },
  { id: '70', name: 'Nellore', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 14.4426, lng: 79.9865 } },
  { id: '71', name: 'Bhavnagar', state: 'Gujarat', type: 'city', coordinates: { lat: 21.7645, lng: 72.1519 } },
  { id: '72', name: 'Dehradun', state: 'Uttarakhand', type: 'city', coordinates: { lat: 30.3165, lng: 78.0322 } },
  { id: '73', name: 'Durgapur', state: 'West Bengal', type: 'city', coordinates: { lat: 23.5204, lng: 87.3119 } },
  { id: '74', name: 'Asansol', state: 'West Bengal', type: 'city', coordinates: { lat: 23.6888, lng: 86.9661 } },
  { id: '75', name: 'Rourkela', state: 'Odisha', type: 'city', coordinates: { lat: 22.2604, lng: 84.8536 } },
  { id: '76', name: 'Nanded', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.1383, lng: 77.321 } },
  { id: '77', name: 'Kolhapur', state: 'Maharashtra', type: 'city', coordinates: { lat: 16.705, lng: 74.2433 } },
  { id: '78', name: 'Ajmer', state: 'Rajasthan', type: 'city', coordinates: { lat: 26.4499, lng: 74.6399 } },
  { id: '79', name: 'Akola', state: 'Maharashtra', type: 'city', coordinates: { lat: 20.7059, lng: 77.0079 } },
  { id: '80', name: 'Gulbarga', state: 'Karnataka', type: 'city', coordinates: { lat: 17.3297, lng: 76.8343 } },
  { id: '81', name: 'Jamnagar', state: 'Gujarat', type: 'city', coordinates: { lat: 22.4707, lng: 70.0577 } },
  { id: '82', name: 'Ujjain', state: 'Madhya Pradesh', type: 'city', coordinates: { lat: 23.1765, lng: 75.7885 } },
  { id: '83', name: 'Loni', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.7504, lng: 77.2935 } },
  { id: '84', name: 'Siliguri', state: 'West Bengal', type: 'city', coordinates: { lat: 26.7271, lng: 88.6393 } },
  { id: '85', name: 'Jhansi', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 25.4484, lng: 78.5685 } },
  { id: '86', name: 'Ulhasnagar', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.2215, lng: 73.1645 } },
  { id: '87', name: 'Jammu', state: 'Jammu and Kashmir', type: 'city', coordinates: { lat: 32.7266, lng: 74.857 } },
  { id: '88', name: 'Sangli', state: 'Maharashtra', type: 'city', coordinates: { lat: 16.8524, lng: 74.5815 } },
  { id: '89', name: 'Mangalore', state: 'Karnataka', type: 'city', coordinates: { lat: 12.9141, lng: 74.856 } },
  { id: '90', name: 'Erode', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 11.341, lng: 77.7172 } },
  { id: '91', name: 'Belgaum', state: 'Karnataka', type: 'city', coordinates: { lat: 15.8497, lng: 74.4977 } },
  { id: '92', name: 'Ambattur', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 13.1143, lng: 80.1548 } },
  { id: '93', name: 'Tirunelveli', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 8.7139, lng: 77.7567 } },
  { id: '94', name: 'Malegaon', state: 'Maharashtra', type: 'city', coordinates: { lat: 20.5579, lng: 74.5089 } },
  { id: '95', name: 'Gaya', state: 'Bihar', type: 'city', coordinates: { lat: 24.7955, lng: 85.0002 } },
  { id: '96', name: 'Jalgaon', state: 'Maharashtra', type: 'city', coordinates: { lat: 21.0077, lng: 75.5626 } },
  { id: '97', name: 'Udaipur', state: 'Rajasthan', type: 'city', coordinates: { lat: 24.5854, lng: 73.7125 } },
  { id: '98', name: 'Maheshtala', state: 'West Bengal', type: 'city', coordinates: { lat: 22.5096, lng: 88.2469 } },
  { id: '99', name: 'Davanagere', state: 'Karnataka', type: 'city', coordinates: { lat: 14.4644, lng: 75.9218 } },
  { id: '100', name: 'Kozhikode', state: 'Kerala', type: 'city', coordinates: { lat: 11.2588, lng: 75.7804 } },
  { id: '101', name: 'Kurnool', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 15.8281, lng: 78.0373 } },
  { id: '102', name: 'Bokaro', state: 'Jharkhand', type: 'city', coordinates: { lat: 23.6693, lng: 86.1511 } },
  { id: '103', name: 'Rajahmundry', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 16.9891, lng: 81.784 } },
  { id: '104', name: 'Ballari', state: 'Karnataka', type: 'city', coordinates: { lat: 15.1394, lng: 76.9214 } },
  { id: '105', name: 'Agartala', state: 'Tripura', type: 'city', coordinates: { lat: 23.8315, lng: 91.2868 } },
  { id: '106', name: 'Bhagalpur', state: 'Bihar', type: 'city', coordinates: { lat: 25.2425, lng: 86.9842 } },
  { id: '107', name: 'Latur', state: 'Maharashtra', type: 'city', coordinates: { lat: 18.4088, lng: 76.5604 } },
  { id: '108', name: 'Dhule', state: 'Maharashtra', type: 'city', coordinates: { lat: 20.9042, lng: 74.7749 } },
  { id: '109', name: 'Korba', state: 'Chhattisgarh', type: 'city', coordinates: { lat: 22.3595, lng: 82.7501 } },
  { id: '110', name: 'Bhilwara', state: 'Rajasthan', type: 'city', coordinates: { lat: 25.3407, lng: 74.6313 } },
  { id: '111', name: 'Brahmapur', state: 'Odisha', type: 'city', coordinates: { lat: 19.3149, lng: 84.7941 } },
  { id: '112', name: 'Muzaffarpur', state: 'Bihar', type: 'city', coordinates: { lat: 26.1209, lng: 85.3647 } },
  { id: '113', name: 'Ahmednagar', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.0948, lng: 74.7377 } },
  { id: '114', name: 'Mathura', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 27.4924, lng: 77.6737 } },
  { id: '115', name: 'Kollam', state: 'Kerala', type: 'city', coordinates: { lat: 8.8932, lng: 76.6141 } },
  { id: '116', name: 'Avadi', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 13.1067, lng: 80.1031 } },
  { id: '117', name: 'Kadapa', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 14.4673, lng: 78.8242 } },
  { id: '118', name: 'Anantapur', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 14.6819, lng: 77.6006 } },
  { id: '119', name: 'Kamarhati', state: 'West Bengal', type: 'city', coordinates: { lat: 22.6704, lng: 88.3731 } },
  { id: '120', name: 'Bilaspur', state: 'Chhattisgarh', type: 'city', coordinates: { lat: 22.0797, lng: 82.1391 } },
  { id: '121', name: 'Sambalpur', state: 'Odisha', type: 'city', coordinates: { lat: 21.4669, lng: 83.9812 } },
  { id: '122', name: 'Shahjahanpur', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 27.8806, lng: 79.9108 } },
  { id: '123', name: 'Satara', state: 'Maharashtra', type: 'city', coordinates: { lat: 17.6805, lng: 74.0183 } },
  { id: '124', name: 'Bijapur', state: 'Karnataka', type: 'city', coordinates: { lat: 16.8302, lng: 75.7135 } },
  { id: '125', name: 'Rampur', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.8019, lng: 79.025 } },
  { id: '126', name: 'Shivamogga', state: 'Karnataka', type: 'city', coordinates: { lat: 13.9299, lng: 75.568 } },
  { id: '127', name: 'Chandrapur', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.9615, lng: 79.2961 } },
  { id: '128', name: 'Junagadh', state: 'Gujarat', type: 'city', coordinates: { lat: 21.5222, lng: 70.4579 } },
  { id: '129', name: 'Thrissur', state: 'Kerala', type: 'city', coordinates: { lat: 10.5276, lng: 76.2144 } },
  { id: '130', name: 'Alwar', state: 'Rajasthan', type: 'city', coordinates: { lat: 27.5667, lng: 76.625 } },
  { id: '131', name: 'Bardhaman', state: 'West Bengal', type: 'city', coordinates: { lat: 23.2324, lng: 87.8615 } },
  { id: '132', name: 'Kakinada', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 16.9891, lng: 82.2475 } },
  { id: '133', name: 'Nizamabad', state: 'Telangana', type: 'city', coordinates: { lat: 18.6725, lng: 78.094 } },
  { id: '134', name: 'Parbhani', state: 'Maharashtra', type: 'city', coordinates: { lat: 19.2704, lng: 76.7765 } },
  { id: '135', name: 'Tumkur', state: 'Karnataka', type: 'city', coordinates: { lat: 13.3379, lng: 77.1173 } },
  { id: '136', name: 'Hisar', state: 'Haryana', type: 'city', coordinates: { lat: 29.1492, lng: 75.7217 } },
  { id: '137', name: 'Rohtak', state: 'Haryana', type: 'city', coordinates: { lat: 28.8955, lng: 76.6066 } },
  { id: '138', name: 'Panipat', state: 'Haryana', type: 'city', coordinates: { lat: 29.3909, lng: 76.9635 } },
  { id: '139', name: 'Darbhanga', state: 'Bihar', type: 'city', coordinates: { lat: 26.1542, lng: 85.8918 } },
  { id: '140', name: 'Kharagpur', state: 'West Bengal', type: 'city', coordinates: { lat: 22.346, lng: 87.232 } },
  { id: '141', name: 'Aizawl', state: 'Mizoram', type: 'city', coordinates: { lat: 23.7271, lng: 92.7176 } },
  { id: '142', name: 'Ichalkaranji', state: 'Maharashtra', type: 'city', coordinates: { lat: 16.6986, lng: 74.4668 } },
  { id: '143', name: 'Tirupati', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 13.6288, lng: 79.4192 } },
  { id: '144', name: 'Karnal', state: 'Haryana', type: 'city', coordinates: { lat: 29.6857, lng: 76.9905 } },
  { id: '145', name: 'Bathinda', state: 'Punjab', type: 'city', coordinates: { lat: 30.2104, lng: 74.9455 } },
  { id: '146', name: 'Ramachandrapuram', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 16.8333, lng: 81.8 } },
  { id: '147', name: 'Ozhukarai', state: 'Puducherry', type: 'city', coordinates: { lat: 11.9493, lng: 79.7714 } },
  { id: '148', name: 'Karimnagar', state: 'Telangana', type: 'city', coordinates: { lat: 18.4386, lng: 79.1288 } },
  { id: '149', name: 'Etawah', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 26.7854, lng: 79.0158 } },
  { id: '150', name: 'Bharatpur', state: 'Rajasthan', type: 'city', coordinates: { lat: 27.2152, lng: 77.5 } },
  { id: '151', name: 'Begusarai', state: 'Bihar', type: 'city', coordinates: { lat: 25.4182, lng: 86.1272 } },
  { id: '152', name: 'Nagercoil', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 8.1833, lng: 77.4119 } },
  { id: '153', name: 'Hospet', state: 'Karnataka', type: 'city', coordinates: { lat: 15.2689, lng: 76.3909 } },
  { id: '154', name: 'Dindigul', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 10.3624, lng: 77.9695 } },
  { id: '155', name: 'Ongole', state: 'Andhra Pradesh', type: 'city', coordinates: { lat: 15.5057, lng: 80.0499 } },
  { id: '156', name: 'Hapur', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.7308, lng: 77.7787 } },
  { id: '157', name: 'Port Blair', state: 'Andaman and Nicobar Islands', type: 'city', coordinates: { lat: 11.6234, lng: 92.7265 } },
  { id: '158', name: 'Ramagundam', state: 'Telangana', type: 'city', coordinates: { lat: 18.7556, lng: 79.4747 } },
  { id: '159', name: 'Haridwar', state: 'Uttarakhand', type: 'city', coordinates: { lat: 29.9457, lng: 78.1642 } },
  { id: '160', name: 'Shimla', state: 'Himachal Pradesh', type: 'city', coordinates: { lat: 31.1048, lng: 77.1734 } },
  { id: '161', name: 'Gangtok', state: 'Sikkim', type: 'city', coordinates: { lat: 27.3389, lng: 88.6065 } },
  { id: '162', name: 'Imphal', state: 'Manipur', type: 'city', coordinates: { lat: 24.817, lng: 93.9368 } },
  { id: '163', name: 'Shillong', state: 'Meghalaya', type: 'city', coordinates: { lat: 25.5788, lng: 91.8933 } },
  { id: '164', name: 'Kohima', state: 'Nagaland', type: 'city', coordinates: { lat: 25.6586, lng: 94.1086 } },
  { id: '165', name: 'Itanagar', state: 'Arunachal Pradesh', type: 'city', coordinates: { lat: 27.0844, lng: 93.6053 } },
  { id: '166', name: 'Panaji', state: 'Goa', type: 'city', coordinates: { lat: 15.4909, lng: 73.8278 } },
  { id: '167', name: 'Thiruvananthapuram', state: 'Kerala', type: 'city', coordinates: { lat: 8.5241, lng: 76.9366 } },
  { id: '168', name: 'Puducherry', state: 'Puducherry', type: 'city', coordinates: { lat: 11.9416, lng: 79.8083 } },
  { id: '169', name: 'Silvassa', state: 'Dadra and Nagar Haveli and Daman and Diu', type: 'city', coordinates: { lat: 20.2766, lng: 73.0169 } },
  { id: '170', name: 'Kavaratti', state: 'Lakshadweep', type: 'city', coordinates: { lat: 10.5626, lng: 72.6369 } },
  { id: '171', name: 'Leh', state: 'Ladakh', type: 'city', coordinates: { lat: 34.1526, lng: 77.5771 } },
  { id: '172', name: 'Greater Noida', state: 'Uttar Pradesh', type: 'city', coordinates: { lat: 28.4744, lng: 77.504 } },
  { id: '173', name: 'Gurgaon', state: 'Haryana', type: 'city', coordinates: { lat: 28.4595, lng: 77.0266 } },
  { id: '174', name: 'Dibrugarh', state: 'Assam', type: 'city', coordinates: { lat: 27.4728, lng: 94.912 } },
  { id: '175', name: 'Jorhat', state: 'Assam', type: 'city', coordinates: { lat: 26.7509, lng: 94.2037 } },
  { id: '176', name: 'Silchar', state: 'Assam', type: 'city', coordinates: { lat: 24.8333, lng: 92.7789 } },
  { id: '177', name: 'Vellore', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 12.9165, lng: 79.1325 } },
  { id: '178', name: 'Thanjavur', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 10.787, lng: 79.1378 } },
  { id: '179', name: 'Cuddalore', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 11.748, lng: 79.7714 } },
  { id: '180', name: 'Kanyakumari', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 8.0883, lng: 77.5385 } },
  { id: '181', name: 'Ooty', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 11.4064, lng: 76.6932 } },
  { id: '182', name: 'Kodaikanal', state: 'Tamil Nadu', type: 'city', coordinates: { lat: 10.2381, lng: 77.4892 } },
  { id: '183', name: 'Rishikesh', state: 'Uttarakhand', type: 'city', coordinates: { lat: 30.0869, lng: 78.2676 } },
  { id: '184', name: 'Nainital', state: 'Uttarakhand', type: 'city', coordinates: { lat: 29.3919, lng: 79.4542 } },
  { id: '185', name: 'Mussoorie', state: 'Uttarakhand', type: 'city', coordinates: { lat: 30.4598, lng: 78.0644 } },
  { id: '186', name: 'Mount Abu', state: 'Rajasthan', type: 'city', coordinates: { lat: 24.5926, lng: 72.7156 } },
  { id: '187', name: 'Pushkar', state: 'Rajasthan', type: 'city', coordinates: { lat: 26.4897, lng: 74.5511 } },
  { id: '188', name: 'Jaisalmer', state: 'Rajasthan', type: 'city', coordinates: { lat: 26.9157, lng: 70.9083 } },
  { id: '189', name: 'Manali', state: 'Himachal Pradesh', type: 'city', coordinates: { lat: 32.2396, lng: 77.1887 } },
  { id: '190', name: 'Dharamshala', state: 'Himachal Pradesh', type: 'city', coordinates: { lat: 32.219, lng: 76.3234 } },
  { id: '191', name: 'Kullu', state: 'Himachal Pradesh', type: 'city', coordinates: { lat: 31.9592, lng: 77.1089 } },
  { id: '192', name: 'Dalhousie', state: 'Himachal Pradesh', type: 'city', coordinates: { lat: 32.5387, lng: 75.9706 } },
  { id: '193', name: 'Munnar', state: 'Kerala', type: 'city', coordinates: { lat: 10.0889, lng: 77.0595 } },
  { id: '194', name: 'Alleppey', state: 'Kerala', type: 'city', coordinates: { lat: 9.4981, lng: 76.3388 } },
  { id: '195', name: 'Wayanad', state: 'Kerala', type: 'city', coordinates: { lat: 11.6854, lng: 76.132 } },
  { id: '196', name: 'Thekkady', state: 'Kerala', type: 'city', coordinates: { lat: 9.6031, lng: 77.1614 } },
  { id: '197', name: 'Madikeri', state: 'Karnataka', type: 'city', coordinates: { lat: 12.4244, lng: 75.7382 } },
  { id: '198', name: 'Hampi', state: 'Karnataka', type: 'city', coordinates: { lat: 15.335, lng: 76.4601 } },
  { id: '199', name: 'Gokarna', state: 'Karnataka', type: 'city', coordinates: { lat: 14.5479, lng: 74.3188 } },
  { id: '200', name: 'Puri', state: 'Odisha', type: 'city', coordinates: { lat: 19.8135, lng: 85.8312 } },
];

export function searchLocations(query: string, excludeLocation?: string): IndianLocation[] {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return INDIAN_LOCATIONS.filter(location => {
    if (excludeLocation && location.name.toLowerCase() === excludeLocation.toLowerCase()) {
      return false;
    }
    
    const matchesName = location.name.toLowerCase().includes(normalizedQuery);
    const matchesState = location.state.toLowerCase().includes(normalizedQuery);
    
    return matchesName || matchesState;
  }).slice(0, 20);
}

export function getLocationByName(name: string): IndianLocation | undefined {
  return INDIAN_LOCATIONS.find(
    location => location.name.toLowerCase() === name.toLowerCase()
  );
}

export function calculateDistance(loc1: IndianLocation, loc2: IndianLocation): number {
  if (!loc1.coordinates || !loc2.coordinates) {
    return Math.floor(Math.random() * 1500) + 100;
  }
  
  const R = 6371;
  const dLat = toRad(loc2.coordinates.lat - loc1.coordinates.lat);
  const dLng = toRad(loc2.coordinates.lng - loc1.coordinates.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(loc1.coordinates.lat)) *
      Math.cos(toRad(loc2.coordinates.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance);
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}
