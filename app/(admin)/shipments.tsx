import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Package,
  Search,
  MapPin,
  Calendar,
  User,
  ChevronRight,
  Camera,
  X,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ShipmentStatus } from '@/types';

interface AdminShipment {
  id: string;
  trackingId: string;
  senderName: string;
  receiverName: string;
  fromCity: string;
  toCity: string;
  status: ShipmentStatus;
  amount: number;
  createdAt: string;
  travelerName?: string;
  pickupImages?: string[];
}

const mockShipments: AdminShipment[] = [
  {
    id: '1',
    trackingId: 'SHP-1234',
    senderName: 'Rahul Sharma',
    receiverName: 'Priya Verma',
    fromCity: 'Hyderabad',
    toCity: 'Patna',
    status: 'in_transit',
    amount: 850,
    createdAt: '2026-01-14',
    travelerName: 'Vikram Singh',
    pickupImages: [
      'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
    ],
  },
  {
    id: '2',
    trackingId: 'SHP-1235',
    senderName: 'Amit Kumar',
    receiverName: 'Neha Gupta',
    fromCity: 'Mumbai',
    toCity: 'Delhi',
    status: 'delivered',
    amount: 1200,
    createdAt: '2026-01-13',
    travelerName: 'Anjali Reddy',
  },
  {
    id: '3',
    trackingId: 'SHP-1236',
    senderName: 'Pooja Iyer',
    receiverName: 'Ravi Kumar',
    fromCity: 'Bangalore',
    toCity: 'Chennai',
    status: 'quoted',
    amount: 600,
    createdAt: '2026-01-12',
  },
  {
    id: '4',
    trackingId: 'SHP-1237',
    senderName: 'Karthik Nair',
    receiverName: 'Meera Joshi',
    fromCity: 'Pune',
    toCity: 'Ahmedabad',
    status: 'created',
    amount: 0,
    createdAt: '2026-01-11',
  },
  {
    id: '5',
    trackingId: 'SHP-1238',
    senderName: 'Suresh Patel',
    receiverName: 'Deepa Sharma',
    fromCity: 'Jaipur',
    toCity: 'Lucknow',
    status: 'completed',
    amount: 950,
    createdAt: '2026-01-10',
    travelerName: 'Vikram Singh',
    pickupImages: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    ],
  },
];

const statusConfig: Record<ShipmentStatus, { label: string; color: string; bg: string }> = {
  created: { label: 'Created', color: Colors.statusCreated, bg: Colors.infoLight },
  quoted: { label: 'Quoted', color: Colors.statusQuoted, bg: '#EDE9FE' },
  assigned: { label: 'Assigned', color: Colors.statusAssigned, bg: Colors.warningLight },
  payment_pending: { label: 'Payment Pending', color: Colors.warning, bg: Colors.warningLight },
  confirmed: { label: 'Confirmed', color: Colors.success, bg: Colors.successLight },
  picked_up: { label: 'Picked Up', color: Colors.statusPickedUp, bg: '#CFFAFE' },
  in_transit: { label: 'In Transit', color: Colors.statusInTransit, bg: '#E0F2FE' },
  out_for_delivery: { label: 'Out for Delivery', color: Colors.info, bg: '#DBEAFE' },
  delivered: { label: 'Delivered', color: Colors.statusDelivered, bg: Colors.successLight },
  completed: { label: 'Completed', color: Colors.statusCompleted, bg: '#D1FAE5' },
};

export default function AdminShipmentsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const filteredShipments = mockShipments.filter(shipment =>
    shipment.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shipment.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Package size={22} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Shipment Management</Text>
              <Text style={styles.headerSubtitle}>{mockShipments.length} total shipments</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID, sender, or receiver..."
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredShipments.map((shipment) => {
          const status = statusConfig[shipment.status];
          return (
            <TouchableOpacity key={shipment.id} style={styles.shipmentCard}>
              <View style={styles.cardHeader}>
                <View style={styles.trackingInfo}>
                  <Text style={styles.trackingId}>{shipment.trackingId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>
                      {status.label}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.textTertiary} />
              </View>

              <View style={styles.routeInfo}>
                <View style={styles.routeCity}>
                  <MapPin size={14} color={Colors.primary} />
                  <Text style={styles.cityText}>{shipment.fromCity}</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeCity}>
                  <MapPin size={14} color={Colors.success} />
                  <Text style={styles.cityText}>{shipment.toCity}</Text>
                </View>
              </View>

              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <User size={14} color={Colors.textTertiary} />
                  <Text style={styles.detailLabel}>Sender:</Text>
                  <Text style={styles.detailValue}>{shipment.senderName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <User size={14} color={Colors.textTertiary} />
                  <Text style={styles.detailLabel}>Receiver:</Text>
                  <Text style={styles.detailValue}>{shipment.receiverName}</Text>
                </View>
                {shipment.travelerName && (
                  <View style={styles.detailRow}>
                    <User size={14} color={Colors.textTertiary} />
                    <Text style={styles.detailLabel}>Traveler:</Text>
                    <Text style={styles.detailValue}>{shipment.travelerName}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.dateInfo}>
                  <Calendar size={14} color={Colors.textTertiary} />
                  <Text style={styles.dateText}>{shipment.createdAt}</Text>
                </View>
                {shipment.amount > 0 && (
                  <Text style={styles.amountText}>₹{shipment.amount}</Text>
                )}
              </View>

              {shipment.pickupImages && shipment.pickupImages.length > 0 && (
                <TouchableOpacity
                  style={styles.viewImagesButton}
                  onPress={() => {
                    setSelectedImages(shipment.pickupImages || []);
                    setCurrentImageIndex(0);
                    setShowImageModal(true);
                  }}
                >
                  <Camera size={16} color={Colors.primary} />
                  <Text style={styles.viewImagesText}>
                    View Pickup Photos ({shipment.pickupImages.length})
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setShowImageModal(false)}
          >
            <X size={24} color={Colors.textInverse} />
          </TouchableOpacity>
          
          <Text style={styles.modalTitle}>
            Pickup Photo {currentImageIndex + 1} of {selectedImages.length}
          </Text>
          
          {selectedImages.length > 0 && (
            <Image
              source={{ uri: selectedImages[currentImageIndex] }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
          
          {selectedImages.length > 1 && (
            <View style={styles.imageNavigation}>
              <TouchableOpacity
                style={[styles.navButton, currentImageIndex === 0 && styles.navButtonDisabled]}
                onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                disabled={currentImageIndex === 0}
              >
                <Text style={styles.navButtonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navButton, currentImageIndex === selectedImages.length - 1 && styles.navButtonDisabled]}
                onPress={() => setCurrentImageIndex(Math.min(selectedImages.length - 1, currentImageIndex + 1))}
                disabled={currentImageIndex === selectedImages.length - 1}
              >
                <Text style={styles.navButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.textInverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  shipmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackingId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  routeCity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  routeLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  cardDetails: {
    marginTop: 14,
    padding: 12,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  viewImagesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight + '20',
    gap: 8,
  },
  viewImagesText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
    marginBottom: 20,
  },
  fullImage: {
    width: '90%',
    height: '60%',
    borderRadius: 12,
  },
  imageNavigation: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 24,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  navButtonDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
