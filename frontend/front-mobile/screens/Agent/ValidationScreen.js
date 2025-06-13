import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  FlatList, 
  Modal, 
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import axios from 'axios';

const ValidationScreen = () => {
  // States pour la validation client
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [clientId, setClientId] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States pour la liste des clients
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // States pour le changement de mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Contexte d'authentification
  const { userToken, logout, userInfo } = useContext(AuthContext);

  // Configuration Axios
  const api = axios.create({
    baseURL: 'http://192.168.1.32:5000/api',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    }
  });

  // Charger les clients
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await api.get('/client/my-clients');
      setClients(res.data || []);
    } catch (err) {
      console.error("Erreur chargement clients:", err);
      Alert.alert('Erreur', err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoadingClients(false);
    }
  };

  // Envoyer OTP
  const sendOtp = async () => {
    if (!userToken) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/client/validate', {
        firstName,
        lastName,
        phone
      });
      
      Alert.alert('Succès', res.data.message);
      setClientId(res.data.clientId);
      setStep(2);
    } catch (err) {
      handleApiError(err, "envoi d'OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vérifier OTP
  const verifyOtp = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/client/verify-otp', {
        clientId,
        otp
      });
      
      Alert.alert('Succès', res.data.message);
      resetForm();
      fetchClients();
    } catch (err) {
      handleApiError(err, "vérification d'OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Changer mot de passe
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      Alert.alert('Succès', 'Mot de passe changé avec succès');
      setShowPasswordModal(false);
      resetPasswordForm();
    } catch (err) {
      handleApiError(err, "changement de mot de passe");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion des erreurs API
  const handleApiError = (err, context) => {
    console.error(`Erreur ${context}:`, err);
    
    let errorMessage = `Erreur lors du ${context}`;
    if (err.response?.status === 401) {
      errorMessage = "Session expirée - Veuillez vous reconnecter";
      logout();
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    }

    Alert.alert('Erreur', errorMessage);
  };

  // Réinitialisation des formulaires
  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setOtp('');
    setStep(1);
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Effet initial
  useEffect(() => {
    if (userToken) {
      fetchClients();
    }
  }, [userToken]);

  // Rendu d'un client
  const renderClientItem = ({ item }) => (
    <View style={styles.clientItem}>
      <Text style={styles.clientName}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={styles.clientDetail}>📞 {item.phone}</Text>
      <View style={styles.clientStatus}>
        <Text style={styles.clientDetail}>Statut: </Text>
        <View style={[styles.statusBadge, item.isValidated ? styles.statusValidated : styles.statusPending]}>
          <Text style={styles.statusText}>
            {item.isValidated ? 'VALIDÉ' : 'EN ATTENTE'}
          </Text>
        </View>
      </View>
      <Text style={styles.clientDetail}>
        📅 {new Date(item.createdAt).toLocaleDateString('fr-FR')}
      </Text>
    </View>
  );

  if (!userToken) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>🔒 Veuillez vous connecter</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" />
      
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion Clients</Text>
        <TouchableOpacity
          style={styles.passwordButton}
          onPress={() => setShowPasswordModal(true)}
        >
          <Text style={styles.passwordButtonText}>Changer MDP</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu principal avec ScrollView */}
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Formulaire de validation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Validation Client</Text>
          
          {step === 1 ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Prénom"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={styles.input}
                placeholder="Nom"
                value={lastName}
                onChangeText={setLastName}
              />
              <TextInput
                style={styles.input}
                placeholder="Téléphone"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={sendOtp}
                disabled={isSubmitting || !firstName || !lastName || !phone}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Envoi en cours...' : 'Envoyer OTP'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.otpText}>Code envoyé au {phone}</Text>
              <TextInput
                style={styles.input}
                placeholder="Code OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={verifyOtp}
                disabled={isSubmitting || !otp}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'Vérification...' : 'Valider Client'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Liste des clients avec hauteur fixe */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Clients ({clients.length})</Text>
            <TouchableOpacity onPress={fetchClients}>
              <Text style={styles.refreshText}>Rafraîchir</Text>
            </TouchableOpacity>
          </View>

          {loadingClients ? (
            <ActivityIndicator size="large" color="#0ea5e9" />
          ) : (
            <View style={styles.listContainer}>
              <FlatList
                data={clients}
                renderItem={renderClientItem}
                keyExtractor={item => item._id}
                scrollEnabled={false} // Désactive le scroll interne
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Aucun client trouvé</Text>
                }
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal changement de mot de passe */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe actuel"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Nouveau mot de passe"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirmer le mot de passe"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  setShowPasswordModal(false);
                  resetPasswordForm();
                }}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={changePassword}
                disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? 'En cours...' : 'Valider'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    backgroundColor: '#0ea5e9',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  passwordButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  passwordButtonText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1e293b',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshText: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryButtonText: {
    color: '#64748b',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  otpText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#64748b',
  },
  listContainer: {
    maxHeight: 400, // Hauteur maximale pour la liste
  },
  clientItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 8,
  },
  clientName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  clientDetail: {
    color: '#64748b',
    marginBottom: 4,
  },
  clientStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusValidated: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalClose: {
    fontSize: 24,
    marginRight: 16,
    color: '#64748b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalContent: {
    padding: 16,
  },
});

export default ValidationScreen;