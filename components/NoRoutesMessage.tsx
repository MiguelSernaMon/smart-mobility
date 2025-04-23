import React from "react";
import { StyleSheet, Text, View } from "react-native";

const NoRoutesMessage = () => {
  return (
    <View style={styles.noRoutesContainer}>
      <Text style={styles.noRoutesText}>
        Presiona "Buscar rutas de autobús" para ver opciones de transporte público.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  noRoutesContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  noRoutesText: {
    textAlign: 'center',
    fontSize: 16,
  },
});

export default NoRoutesMessage;