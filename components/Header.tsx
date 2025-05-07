import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchDestination: () => void;
  searchLoading: boolean;
  fetchBusRoutes: () => void;
  loading: boolean;
}

const Header = ({ 
  searchQuery, 
  setSearchQuery, 
  searchDestination, 
  searchLoading, 
  fetchBusRoutes, 
  loading 
}: HeaderProps) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Busca tu destino</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Ingresa una dirección"
          value={searchQuery}
          onChangeText={(text) => setSearchQuery(text)}
          onSubmitEditing={searchDestination}
        />
        <TouchableOpacity 
          style={styles.searchAddressButton}
          onPress={searchDestination}
          disabled={searchLoading}
        >
          {searchLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.searchAddressButton, loading && styles.searchAddressButton]}
        onPress={fetchBusRoutes}
        disabled={loading}
      >
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingHorizontal: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchAddressButton: {
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  searchButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Header;