import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

 const login = async (userData, token) => {
  console.log('Login reçu:', userData);

  if (!userData?.role) {
    console.warn('⚠️ Aucun rôle trouvé dans userData:', userData);
  }

  setUserInfo(userData);
  setUserToken(token);
  await AsyncStorage.setItem('userToken', token);
  await AsyncStorage.setItem('userInfo', JSON.stringify(userData));
};

  const logout = async () => {
    setUserInfo(null);
    setUserToken(null);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userInfo');
  };

  const isLoggedIn = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const user = await AsyncStorage.getItem('userInfo');
      if (token && user) {
        setUserToken(token);
        setUserInfo(JSON.parse(user));
      }
    } catch (e) {
      console.log('Erreur auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider value={{ login, logout, userToken, userInfo, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
