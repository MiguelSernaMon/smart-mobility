import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ImageBackground, 
  TextInput, 
  Platform
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

interface BannerHeaderProps {
  onSearch: (destination: string) => void;
}

export default function BannerHeader({ onSearch }: BannerHeaderProps) {
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = () => {
    if (searchText.trim()) {
      onSearch(searchText);
    }
  };
  
  return (
    <ImageBackground
      source={require("@/assets/images/bg-banner.png")}
      style={styles.banner}
      imageStyle={styles.bannerImage}
    >
      {/* Barra de navegación */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol
            name="line.horizontal.3"
            size={24}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
        </TouchableOpacity>

        <ThemedText style={styles.cityTitle}>Medellín</ThemedText>
      </View>

      <View style={styles.bannerOverlay}>
        {/* Campo de búsqueda */}
        <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                  <Ionicons name="location" size={20} color="#666" style={styles.icon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="¿A dónde vas?"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                      <Ionicons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                  <Ionicons name="search" size={22} color="white" />
                </TouchableOpacity>
              </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 4 : 12, // SafeAreaView ya proporciona margen en iOS
      paddingBottom: 12,
      zIndex: 1,
    },
    searchBar: {
      width: "60%",
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderTopStartRadius: 8,
      borderBottomStartRadius: 8,
      paddingHorizontal: 12,
      height: 46,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    icon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: '#333',
    },
    clearButton: {
      padding: 4,
    },
    searchButton: {
      backgroundColor: '#1976D2',
      width: 46,
      height: 46,
      borderEndEndRadius: 8,
      borderTopEndRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
      elevation: 3,
    },
  banner: {
    width: '100%',
    height: 173,
  },
  bannerImage: {
    resizeMode: 'cover',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    backgroundColor: 'transparent',
  },
  menuButton: {
    padding: 8,
  },
  cityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  bannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    width: '90%',
    height: 50,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  
});