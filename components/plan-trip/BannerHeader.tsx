import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  ImageBackground, 
  TextInput 
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BannerHeaderProps {
  onSearch: (destination: string) => void;
}

export default function BannerHeader({ onSearch }: BannerHeaderProps) {
  const colorScheme = useColorScheme();
  const [searchText, setSearchText] = useState('');
  
  const handleSearchPress = () => {
    if (searchText.trim()) {
      onSearch(searchText);
    }
  };
  
  return (
    <ImageBackground
      source={require('@/assets/images/bg-banner.png')}
      style={styles.banner}
      imageStyle={styles.bannerImage}
    >
      {/* Barra de navegación */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol 
            name="line.horizontal.3" 
            size={24} 
            color={colorScheme === 'dark' ? '#fff' : '#000'} 
          />
        </TouchableOpacity>
        
        <ThemedText style={styles.cityTitle}>Medellín</ThemedText>
      </View>
      
      <View style={styles.bannerOverlay}>
        {/* Campo de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <IconSymbol 
              name="magnifyingglass" 
              size={20} 
              color="#666"
              style={styles.searchIcon} 
            />
            <TextInput
              style={styles.searchInput}
              placeholder="¿A dónde quieres ir?"
              placeholderTextColor="#666"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearchPress}
          >
            <IconSymbol 
              name="arrow.right" 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
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
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    width: 50,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});