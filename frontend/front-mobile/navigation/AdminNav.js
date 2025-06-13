import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/Admin/HomeScreen';
import CreateAgentScreen from '../screens/Admin/CreateAgentScreen';
import AgentListScreen from '../screens/Admin/AgentListScreen';
import AgentClientsScreen from '../screens/Admin/AgentClientsScreen';

const Stack = createNativeStackNavigator();

export default function AdminNav() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerTitle: 'Accueil Admin' }}
      />
      <Stack.Screen
        name="CreateAgent"
        component={CreateAgentScreen}
        options={{ headerTitle: 'Créer un agent' }}
      />
      <Stack.Screen
        name="Agents"
        component={AgentListScreen}
        options={{ headerTitle: 'Liste des agents' }}
      />
      <Stack.Screen
        name="AgentClients"
        component={AgentClientsScreen}
        options={{ headerTitle: 'Clients de l’agent' }}
      />
    </Stack.Navigator>
  );
}
