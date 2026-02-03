import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MapPin, Search, X, Navigation } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { searchLocations, IndianLocation, INDIAN_STATES } from '@/constants/indianLocations';

interface LocationSearchProps {
  value: string;
  onSelect: (location: string, fullLocation?: IndianLocation) => void;
  placeholder?: string;
  excludeLocation?: string;
  iconColor?: string;
}

export default function LocationSearch({
  value,
  onSelect,
  placeholder = 'Search location in India',
  excludeLocation,
  iconColor = Colors.primary,
}: LocationSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<IndianLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    setTimeout(() => {
      const searchResults = searchLocations(query, excludeLocation);
      setResults(searchResults);
      setIsSearching(false);
    }, 150);
  }, [excludeLocation]);

  const handleSelect = useCallback((location: IndianLocation) => {
    onSelect(location.name, location);
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
  }, [onSelect]);

  const handleOpenModal = useCallback(() => {
    setIsOpen(true);
    setSearchQuery('');
    setResults([]);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setResults([]);
  }, []);

  const renderLocationItem = useCallback(({ item }: { item: IndianLocation }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelect(item)}
    >
      <MapPin size={18} color={Colors.primary} />
      <View style={styles.resultTextContainer}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultState}>{item.state}</Text>
      </View>
    </TouchableOpacity>
  ), [handleSelect]);

  return (
    <>
      <TouchableOpacity style={styles.selectInput} onPress={handleOpenModal}>
        <MapPin size={20} color={iconColor} />
        <Text style={[styles.selectText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Search size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Search size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city, town, or state..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <X size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : results.length > 0 ? (
              <FlatList
                data={results}
                renderItem={renderLocationItem}
                keyExtractor={(item) => item.id}
                style={styles.resultsList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              />
            ) : searchQuery.length >= 2 ? (
              <View style={styles.noResultsContainer}>
                <Navigation size={48} color={Colors.textTertiary} />
                <Text style={styles.noResultsText}>No locations found</Text>
                <Text style={styles.noResultsHint}>
                  Try searching for a different city or state
                </Text>
              </View>
            ) : (
              <View style={styles.hintContainer}>
                <Navigation size={48} color={Colors.primary} />
                <Text style={styles.hintTitle}>Search Any Location in India</Text>
                <Text style={styles.hintText}>
                  Type at least 2 characters to search for cities, towns, or states across India
                </Text>
                <View style={styles.popularStates}>
                  <Text style={styles.popularTitle}>Popular States</Text>
                  <View style={styles.stateChips}>
                    {INDIAN_STATES.slice(0, 8).map((state) => (
                      <TouchableOpacity
                        key={state}
                        style={styles.stateChip}
                        onPress={() => handleSearch(state)}
                      >
                        <Text style={styles.stateChipText}>{state}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    gap: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  placeholder: {
    color: Colors.textTertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  resultsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  resultState: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  noResultsHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  hintContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  hintText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  popularStates: {
    marginTop: 24,
    width: '100%',
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  stateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stateChip: {
    backgroundColor: Colors.primaryLight + '30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stateChipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
});
