// 


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import axios from 'axios';

const API_BASE = 'http://192.168.1.32:5000';

const HomeScreen = () => {
  const [agents, setAgents] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedAgentName, setSelectedAgentName] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/agents`);
      setAgents(res.data);
    } catch (err) {
      console.error('Erreur chargement agents', err);
    }
  };

  const createAgent = async () => {
    try {
      await axios.post(`${API_BASE}/api/admin/create-agent`, {
        name,
        phone,
        password,
      });
      setName('');
      setPhone('');
      setPassword('');
      fetchAgents();
    } catch (err) {
      console.error('Erreur création agent', err);
    }
  };

  const toggleAgent = async (agentId) => {
    try {
      await axios.put(`${API_BASE}/api/admin/agents/${agentId}/toggle`);
      fetchAgents();
    } catch (err) {
      console.error('Erreur toggle agent', err);
    }
  };

  const fetchAgentClients = async (agentId, agentName) => {
    try {
      const res = await axios.get(`${API_BASE}/api/client/agent/${agentId}/clients`);
      setClients(res.data);
      setSelectedAgentName(agentName);
    } catch (err) {
      console.error('Erreur chargement clients', err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏠 Accueil Admin</Text>

      <Text style={styles.subtitle}>Créer un nouvel agent</Text>
      <TextInput
        placeholder="Nom"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Téléphone"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      <TextInput
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Créer l’agent" onPress={createAgent} />

      <Text style={styles.subtitle}>Liste des agents</Text>
      <FlatList
        data={agents}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.agentCard}>
            <Text style={styles.agentText}>
              👤 {item.name} ({item.phone}) - {item.isActive ? '✅ Actif' : '❌ Inactif'}
            </Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleAgent(item._id)}
              >
                <Text style={styles.btnText}>Activer/Désactiver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => fetchAgentClients(item._id, item.name)}
              >
                <Text style={styles.btnText}>Voir Clients</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {clients.length > 0 && (
        <View style={styles.clientsSection}>
          <Text style={styles.subtitle}>Clients de {selectedAgentName}</Text>
          {clients.map((client) => (
            <Text key={client._id} style={styles.clientText}>
              • {client.firstName} {client.lastName} - {client.phone}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 80,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  agentCard: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  agentText: {
    fontSize: 16,
    marginBottom: 6,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 6,
    marginTop: 5,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
  clientsSection: {
    marginTop: 20,
  },
  clientText: {
    fontSize: 15,
    marginVertical: 2,
  },
});

export default HomeScreen;
