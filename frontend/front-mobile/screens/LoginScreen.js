import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const BASE_URL = 'http://192.168.1.3:5000';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);

  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);

 const handleLogin = async () => {
  // Validation des champs
  if ((loginMethod === 'email' && !email.trim()) || 
      (loginMethod === 'phone' && !phone.trim()) || 
      !password) {
    setError("Veuillez remplir tous les champs");
    return;
  }

  setLoading(true);
  setError('');
  setTimeoutError(false);

  const timeoutId = setTimeout(() => {
    if (loading) {
      setTimeoutError(true);
    }
  }, 10000);

  try {
    const startTime = Date.now();
    
    // Construction propre des données - on évite les undefined
    const requestData = {
      password: password.trim(),
    };
    
    if (loginMethod === 'email') {
      requestData.email = email.trim();
    } else {
      // Nettoyage du numéro de téléphone (supprime espaces, tirets, etc.)
      requestData.phone = phone.trim().replace(/[\s\-\(\)]/g, '');
    }
    
    console.log("=== DEBUG LOGIN ===");
    console.log("URL:", `${BASE_URL}/api/auth/login`);
    console.log("Method:", loginMethod);
    console.log("Request data:", requestData);
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, requestData, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Ajout pour debug réseau
      validateStatus: function (status) {
        return status < 500; // Accepte les erreurs 4xx pour les voir
      }
    });

    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
    console.log("Temps de réponse:", Date.now() - startTime, "ms");

    if (response.status === 200 && response.data?.token) {
      const { token, ...user } = response.data;
      login(user, token);
    } else {
      // Gestion des erreurs HTTP
      const errorMsg = response.data?.message || `Erreur ${response.status}`;
      setError(errorMsg);
    }
    
  } catch (err) {
    console.log("=== ERREUR COMPLÈTE ===");
    console.log("Type:", err.constructor.name);
    console.log("Message:", err.message);
    console.log("Code:", err.code);
    
    let errorMsg = "Erreur de connexion";
    
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      errorMsg = "Connexion expirée - vérifiez votre réseau";
    } else if (err.code === 'ECONNREFUSED') {
      errorMsg = "Serveur inaccessible - vérifiez l'adresse IP";
    } else if (err.code === 'ENOTFOUND') {
      errorMsg = "Adresse serveur introuvable";
    } else if (err.response) {
      const status = err.response.status;
      const data = err.response.data;
      
      if (status === 401) {
        errorMsg = "Identifiants incorrects";
      } else if (status === 400) {
        errorMsg = data?.message || "Données invalides";
      } else if (status >= 500) {
        errorMsg = "Erreur du serveur";
      } else {
        errorMsg = data?.message || `Erreur ${status}`;
      }
    } else if (err.request) {
      errorMsg = "Impossible de joindre le serveur - vérifiez votre connexion";
    }
    
    setError(errorMsg);
    console.log("Message d'erreur final:", errorMsg);
    
  } finally {
    clearTimeout(timeoutId);
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo et titre */}
          <View style={styles.headerContainer}>
            <Text style={styles.logo}>dioko</Text>
            <View style={styles.logoUnderline} />
            <Text style={styles.welcomeText}>Bon retour !</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
          </View>

          {/* Formulaire de connexion */}
          <View style={styles.formContainer}>
            {/* Affichage d'erreur */}
            {(error !== '' || timeoutError) && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.error}>
                  {timeoutError 
                    ? "La connexion prend plus de temps que prévu. Vérifiez votre connexion." 
                    : error}
                </Text>
              </View>
            )}

            {/* Sélecteur de méthode de connexion */}
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  loginMethod === 'email' && styles.methodButtonActive
                ]}
                onPress={() => setLoginMethod('email')}
                disabled={loading}
              >
                <Ionicons 
                  name="mail" 
                  size={18} 
                  color={loginMethod === 'email' ? '#3B82F6' : '#6B7280'} 
                />
                <Text style={[
                  styles.methodButtonText,
                  loginMethod === 'email' && styles.methodButtonTextActive
                ]}>
                  Email
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  loginMethod === 'phone' && styles.methodButtonActive
                ]}
                onPress={() => setLoginMethod('phone')}
                disabled={loading}
              >
                <Ionicons 
                  name="call" 
                  size={18} 
                  color={loginMethod === 'phone' ? '#3B82F6' : '#6B7280'} 
                />
                <Text style={[
                  styles.methodButtonText,
                  loginMethod === 'phone' && styles.methodButtonTextActive
                ]}>
                  Téléphone
                </Text>
              </TouchableOpacity>
            </View>

            {/* Champ Email ou Téléphone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {loginMethod === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name={loginMethod === 'email' ? 'mail' : 'call'} 
                  size={20} 
                  color="#6B7280" 
                  style={styles.inputIcon}
                />
                <TextInput
                  value={loginMethod === 'email' ? email : phone}
                  onChangeText={loginMethod === 'email' ? setEmail : setPhone}
                  placeholder={loginMethod === 'email' ? 'votre@email.com' : '+33 6 12 34 56 78'}
                  style={styles.textInput}
                  keyboardType={loginMethod === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Champ Mot de passe */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <Ionicons 
                  name="lock-closed" 
                  size={20} 
                  color="#6B7280" 
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  style={styles.textInput}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Options additionnelles */}
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.forgotPassword}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            </View>

            {/* Bouton de connexion */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <ActivityIndicator color="#FFFFFF" style={{marginRight: 10}} />
                  <Text style={styles.loginButtonText}>Connexion en cours...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                En vous connectant, vous acceptez nos{' '}
                <Text style={styles.footerLink}>Conditions d'utilisation</Text>
                {' '}et notre{' '}
                <Text style={styles.footerLink}>Politique de confidentialité</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#3B82F6',
    letterSpacing: -2,
  },
  logoUnderline: {
    width: 60,
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2,
    marginTop: 8,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  methodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  methodButtonTextActive: {
    color: '#3B82F6',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 16,
  },
  optionsContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});