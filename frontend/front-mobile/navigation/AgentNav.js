import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ValidationScreen from '../screens/Agent/ValidationScreen';
import ClientListScreen from '../screens/Agent/ClientListScreen';
import SettingsScreen from '../screens/Agent/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AgentNav() {
  return (
    <Stack.Navigator initialRouteName="Validation">
      <Stack.Screen
        name="Validation"
        component={ValidationScreen}
        options={{ headerTitle: 'Valider un client' }}
      />
      <Stack.Screen
        name="Clients"
        component={ClientListScreen}
        options={{ headerTitle: 'Mes clients' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: 'Paramètres' }}
      />
    </Stack.Navigator>
  );
}
