import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView, 
  Platform,
  StatusBar,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { LinearGradient } from 'expo-linear-gradient';

export default function AboutUs() {
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState('medellin');
  
  // Contactos de emergencia por ciudad
  const emergencyContacts = {
    medellin: [
      { name: 'Policía Nacional', number: '123', icon: 'shield-checkmark' },
      { name: 'Bomberos Medellín', number: '119', icon: 'flame' },
      { name: 'Ambulancia', number: '125', icon: 'medkit' },
      { name: 'Línea Única de Emergencias', number: '123', icon: 'call' },
      { name: 'Secretaría de Movilidad', number: '(604) 444 41 44', icon: 'car' }
    ],
    envigado: [
      { name: 'Policía Envigado', number: '(604) 339 40 17', icon: 'shield-checkmark' },
      { name: 'Bomberos Envigado', number: '(604) 270 66 63', icon: 'flame' },
      { name: 'Tránsito Envigado', number: '(604) 339 40 29', icon: 'car' },
      { name: 'Emergencias', number: '123', icon: 'call' }
    ],
    bello: [
      { name: 'Policía Bello', number: '(604) 484 82 83', icon: 'shield-checkmark' },
      { name: 'Bomberos Bello', number: '(604) 454 21 10', icon: 'flame' },
      { name: 'Tránsito Bello', number: '(604) 604 79 19', icon: 'car' },
      { name: 'Emergencias', number: '123', icon: 'call' }
    ],
    itagui: [
      { name: 'Policía Itagüí', number: '(604) 373 76 76', icon: 'shield-checkmark' },
      { name: 'Bomberos Itagüí', number: '(604) 371 33 36', icon: 'flame' },
      { name: 'Tránsito Itagüí', number: '(604) 360 98 09', icon: 'car' },
      { name: 'Emergencias', number: '123', icon: 'call' }
    ],
    sabaneta: [
      { name: 'Policía Sabaneta', number: '(604) 288 12 25', icon: 'shield-checkmark' },
      { name: 'Bomberos Sabaneta', number: '(604) 288 15 08', icon: 'flame' },
      { name: 'Tránsito Sabaneta', number: '(604) 301 42 04', icon: 'car' },
      { name: 'Emergencias', number: '123', icon: 'call' }
    ]
  };
  
  const openContactModal = (city = 'medellin') => {
    setSelectedCity(city);
    setContactModalVisible(true);
  };
  
  const callNumber = (number) => {
    // Eliminar espacios y paréntesis para el marcado
    const cleanNumber = number.replace(/\s|\(|\)/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Encabezado con gradiente */}
        <LinearGradient
          colors={['#1976D2', '#64B5F6']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Smart Mobility</Text>
          <Text style={styles.headerSubtitle}>Movilidad inteligente para todos</Text>
        </LinearGradient>
        
        {/* Sección Quiénes Somos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿Quiénes Somos?</Text>
          <Text style={styles.paragraph}>
            Smart Mobility es una aplicación diseñada para revolucionar la forma en que te desplazas por el Área Metropolitana del Valle de Aburrá. Combinamos datos de transporte público en tiempo real, información sobre el estado del clima y puntos de interés para ofrecerte la mejor experiencia de movilidad.
          </Text>
          <Text style={styles.paragraph}>
            Nuestro equipo está compuesto por estudiantes de ingeniería de sistemas de la universidad de antioquia, que trabajan con el objetivo de crear soluciones que mejoren la calidad de vida de los ciudadanos a través de la tecnología.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="map" size={32} color="#1976D2" />
              <Text style={styles.featureTitle}>Rutas Inteligentes</Text>
              <Text style={styles.featureText}>Planifica tus viajes con las mejores opciones multimodales</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="umbrella" size={32} color="#1976D2" />
              <Text style={styles.featureTitle}>Alertas Climáticas</Text>
              <Text style={styles.featureText}>Anticípate a la lluvia y otros eventos que afecten tu movilidad</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="walk" size={32} color="#1976D2" />
              <Text style={styles.featureTitle}>Cruces Seguros</Text>
              <Text style={styles.featureText}>Identifica cruces peatonales seguros durante tu recorrido</Text>
            </View>
          </View>
        </View>
        
        {/* Sección Video */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nuestro Proyecto</Text>
          <View style={styles.videoContainer}>
            <YoutubePlayer
              height={220}
              videoId="dQw4w9WgXcQ" // Reemplaza con tu ID de video real
              play={false}
              onChangeState={(event) => console.log(event)}
              webViewStyle={{ opacity: 0.99 }}
            />
          </View>
          <Text style={styles.caption}>Conoce más sobre la visión de Smart Mobility</Text>
        </View>
        
        {/* Sección Contactos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          <Text style={styles.paragraph}>
            Estamos comprometidos con mejorar continuamente nuestra aplicación. Si tienes preguntas, sugerencias o comentarios, no dudes en contactarnos:
          </Text>
          
          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={24} color="#1976D2" />
              <Text style={styles.contactText}>contacto@smartmobility.co</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call" size={24} color="#1976D2" />
              <Text style={styles.contactText}>(604) 123-4567</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="location" size={24} color="#1976D2" />
              <Text style={styles.contactText}>Medellín, Colombia</Text>
            </View>
          </View>
          
          {/* Botón de emergencia */}
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => openContactModal()}
          >
            <Ionicons name="alert-circle" size={24} color="white" />
            <Text style={styles.emergencyButtonText}>Contactos de Emergencia</Text>
          </TouchableOpacity>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Smart Mobility App
          </Text>
          <View style={styles.socialIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="logo-facebook" size={24} color="#1976D2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="logo-twitter" size={24} color="#1976D2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="logo-instagram" size={24} color="#1976D2" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Modal de Contactos de Emergencia */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contactos de Emergencia</Text>
              <TouchableOpacity onPress={() => setContactModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Selector de ciudad */}
            <View style={styles.citySelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Object.keys(emergencyContacts).map(city => (
                  <TouchableOpacity 
                    key={city} 
                    style={[
                      styles.cityButton, 
                      selectedCity === city ? styles.cityButtonActive : null
                    ]}
                    onPress={() => setSelectedCity(city)}
                  >
                    <Text 
                      style={[
                        styles.cityButtonText, 
                        selectedCity === city ? styles.cityButtonTextActive : null
                      ]}
                    >
                      {city.charAt(0).toUpperCase() + city.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Lista de contactos */}
            <ScrollView style={styles.contactsList}>
              {emergencyContacts[selectedCity].map((contact, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.contactCard}
                  onPress={() => callNumber(contact.number)}
                >
                  <View style={styles.contactCardIcon}>
                    <Ionicons name={contact.icon} size={24} color="white" />
                  </View>
                  <View style={styles.contactCardInfo}>
                    <Text style={styles.contactCardTitle}>{contact.name}</Text>
                    <Text style={styles.contactCardNumber}>{contact.number}</Text>
                  </View>
                  <Ionicons name="call" size={24} color="#1976D2" />
                </TouchableOpacity>
              ))}
              
              <Text style={styles.disclaimer}>
                En caso de emergencia, marque directamente al 123
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    marginBottom: 15,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  featureItem: {
    width: '30%',
    alignItems: 'center',
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 5,
  },
  featureText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  videoContainer: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  caption: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  contactInfo: {
    marginVertical: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 15,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  footerText: {
    color: '#666',
    marginBottom: 10,
  },
  socialIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    paddingHorizontal: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  citySelector: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  cityButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  cityButtonActive: {
    backgroundColor: '#1976D2',
  },
  cityButtonText: {
    fontSize: 14,
    color: '#333',
  },
  cityButtonTextActive: {
    color: 'white',
  },
  contactsList: {
    paddingHorizontal: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  contactCardIcon: {
    backgroundColor: '#1976D2',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactCardInfo: {
    flex: 1,
  },
  contactCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  contactCardNumber: {
    fontSize: 14,
    color: '#666',
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 20,
  },
});