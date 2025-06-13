import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppNav from './navigation/AppNav';

export default function App() {
  return (
    <AuthProvider>
      <AppNav />
    </AuthProvider>
  );
}
