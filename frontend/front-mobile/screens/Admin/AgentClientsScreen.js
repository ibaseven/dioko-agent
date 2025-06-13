import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AgentClientsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liste des clients de l’agent</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AgentClientsScreen;
