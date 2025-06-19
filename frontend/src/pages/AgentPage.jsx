import React, { useEffect, useState } from 'react';
import { FiLogOut, FiUserPlus, FiUsers, FiMenu, FiX, FiCalendar, FiDollarSign, FiClock } from 'react-icons/fi';
import './AgentDashboard.css';
import logo from '../assets/logo.png';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_BASE = 'http://localhost:5000';
const COMMISSION_PER_CLIENT = 160; // 160 FCFA par client

const AgentDashboard = () => {
  const [currentScreen, setCurrentScreen] = useState('validation');
  const [formStep, setFormStep] = useState(1);
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId, setClientId] = useState('');
  const [otp, setOtp] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [clientList, setClientList] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [clientCountByDate, setClientCountByDate] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Séparer les clients validés et en attente
  const validatedClients = clientList.filter(client => client.validatedAt);
  const pendingClients = clientList.filter(client => !client.validatedAt);

  // Calcul du salaire basé uniquement sur les clients validés
  const calculateSalary = (clients) => {
    return clients.filter(client => client.validatedAt).length * COMMISSION_PER_CLIENT;
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationMessage('');
    
    if (formStep === 1) {
      setValidationMessage('Enregistrement du client...');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setValidationMessage('Token d\'authentification manquant');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/api/client/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: clientFirstName,
            lastName: clientLastName,
            phone: clientPhone,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.clientId) {
          setClientId(data.clientId);
        }
        
        setValidationMessage('✅ Code OTP envoyé. Veuillez entrer le code.');
        setFormStep(2);
        
      } catch (error) {
        console.error('Erreur lors de la création:', error);
        setValidationMessage(`Erreur: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      await handleValidateOtp(e);
    }
  };

  const handleValidateOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setValidationMessage('Vérification du code OTP...');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setValidationMessage('Token d\'authentification manquant');
        setIsLoading(false);
        return;
      }

      const requestBody = {
        phone: clientPhone,
        otp: otp,
      };

      if (clientId) {
        requestBody.clientId = clientId;
      }

      const response = await fetch(`${API_BASE}/api/client/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `Erreur HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Erreur lors du parsing de la réponse d\'erreur:', parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      setValidationMessage('✅ Client validé avec succès.');
      
      // Réinitialiser le formulaire
      setClientFirstName('');
      setClientLastName('');
      setClientPhone('');
      setClientId('');
      setOtp('');
      setFormStep(1);
      
      // Recharger la liste des clients
      await fetchMyClients();
      
    } catch (error) {
      console.error('Erreur lors de la validation OTP:', error);
      setValidationMessage(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyClients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setValidationMessage('Token d\'authentification manquant');
        return;
      }

      const response = await fetch(`${API_BASE}/api/client/my-clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setClientList(data);
      calculateClientCountByDate(data);
      
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setValidationMessage(`Erreur chargement clients: ${error.message}`);
    }
  };

  const calculateClientCountByDate = (clients) => {
    const countMap = {};
    
    clients.forEach(client => {
      if (client.validatedAt) {
        const date = new Date(client.validatedAt);
        const dateString = date.toISOString().split('T')[0];
        
        if (countMap[dateString]) {
          countMap[dateString]++;
        } else {
          countMap[dateString] = 1;
        }
      }
    });
    
    setClientCountByDate(countMap);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${API_BASE}/api/user/logout`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    }

    localStorage.removeItem('token');
    window.location.href = "/";
  };

  const resetForm = () => {
    setClientFirstName('');
    setClientLastName('');
    setClientPhone('');
    setClientId('');
    setOtp('');
    setFormStep(1);
    setValidationMessage('');
  };

  useEffect(() => {
    fetchMyClients();
  }, []);

  const filterClients = () => {
    const now = new Date();
    return clientList.filter(client => {
      if (!client.validatedAt) return false;
      const date = new Date(client.validatedAt);

      if (filter === 'day') {
        return date.toDateString() === now.toDateString();
      } else if (filter === 'week') {
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(now.getDate() - 7);
        return date >= oneWeekAgo;
      } else if (filter === 'month') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else if (filter === 'date') {
        return date.toDateString() === selectedDate.toDateString();
      }
      return true;
    }).filter(client => {
      const name = `${client.firstName} ${client.lastName}`.toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || client.phone.includes(searchTerm);
    });
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toISOString().split('T')[0];
      const count = clientCountByDate[dateString] || 0;
      
      return (
        <div className="calendar-day-content">
          {count > 0 && <div className="client-count-badge">{count}</div>}
        </div>
      );
    }
    return null;
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setFilter('date');
    setCalendarOpen(false);
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <img src={logo} alt="DIOKO" className="logo-img" />
            <div className="app-title">DIOKO</div>
            <div className="user-badge">AGENT</div>
          </div>
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className={`app-nav ${sidebarOpen ? 'open' : ''}`}>
        <button 
          className={`nav-item ${currentScreen === 'validation' ? 'active' : ''}`}
          onClick={() => {
            setCurrentScreen('validation');
            setSidebarOpen(false);
          }}
        >
          <span className="nav-icon"><FiUserPlus /></span>
          <span className="nav-text">Validation</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'clients' ? 'active' : ''}`}
          onClick={() => {
            setCurrentScreen('clients');
            setSidebarOpen(false);
            fetchMyClients();
          }}
        >
          <span className="nav-icon"><FiUsers /></span>
          <span className="nav-text">Mes Clients</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'salary' ? 'active' : ''}`}
          onClick={() => {
            setCurrentScreen('salary');
            setSidebarOpen(false);
          }}
        >
          <span className="nav-icon"><FiDollarSign /></span>
          <span className="nav-text">Mon Salaire</span>
        </button>
        <button 
          className="nav-item"
          onClick={handleLogout}
        >
          <span className="nav-icon"><FiLogOut /></span>
          <span className="nav-text">Déconnexion</span>
        </button>
      </nav>
      
      {/* Main Content */}
      <main className="app-main">
        {/* Validation Screen */}
        {currentScreen === 'validation' && (
          <div className="screen-container">
            <div className="form-card">
              <h2 className="screen-title">Validation Client</h2>
              
              {formStep === 1 ? (
                <form onSubmit={handleCreateClient} className="form-container">
                  <div className="input-group">
                    <label className="input-label">Prénom du client</label>
                    <input 
                      type="text" 
                      value={clientFirstName}
                      onChange={(e) => setClientFirstName(e.target.value)}
                      className="form-input"
                      placeholder="Ex: Jean"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Nom du client</label>
                    <input 
                      type="text" 
                      value={clientLastName}
                      onChange={(e) => setClientLastName(e.target.value)}
                      className="form-input"
                      placeholder="Ex: Dupont"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Numéro de téléphone</label>
                    <input 
                      type="tel" 
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="form-input"
                      placeholder="Ex: +221773152659"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Envoi en cours...' : 'Envoyer OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateClient} className="form-container">
                  <div className="otp-info">
                    <p>Un code OTP a été envoyé au numéro</p>
                    <p className="phone-number">{clientPhone}</p>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Code OTP</label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="form-input"
                      placeholder="Ex: 123456"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Validation en cours...' : 'Valider le client'}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                    disabled={isLoading}
                  >
                    Retour
                  </button>
                </form>
              )}
              
              {validationMessage && (
                <div className="message-container">
                  <p className={`message ${validationMessage.includes('✅') ? 'success' : validationMessage.includes('Erreur') ? 'error' : 'info'}`}>
                    {validationMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clients Screen */}
        {currentScreen === 'clients' && (
          <div className="screen-container">
            <div className="list-card">
              <h2 className="screen-title">Mes Clients</h2>
              
              <div className="filter-bar">
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tous</option>
                  <option value="day">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="date">Date spécifique</option>
                </select>
                
                {filter === 'date' && (
                  <div className="date-picker-container">
                    <button 
                      type="button" 
                      onClick={() => setCalendarOpen(!calendarOpen)}
                      className="date-picker-button"
                    >
                      <FiCalendar size={18} />
                      {selectedDate.toLocaleDateString()}
                    </button>
                    {calendarOpen && (
                      <div className="calendar-popup">
                        <Calendar
                          onChange={handleDateChange}
                          value={selectedDate}
                          tileContent={tileContent}
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="stats-summary">
                <div className="stat-card">
                  <h3>Total Clients</h3>
                  <p>{clientList.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Validés</h3>
                  <p>{validatedClients.length}</p>
                </div>
                <div className="stat-card">
                  <h3>En attente</h3>
                  <p>{pendingClients.length}</p>
                </div>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Date de validation</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientList.map((client, index) => (
                      <tr key={index}>
                        <td>{client.firstName} {client.lastName}</td>
                        <td>{client.phone}</td>
                        <td>
                          {client.validatedAt 
                            ? new Date(client.validatedAt).toLocaleDateString() 
                            : 'Non validé'}
                        </td>
                        <td>
                          {client.validatedAt 
                            ? <span className="status-badge validated">Validé</span>
                            : <span className="status-badge pending">En attente</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {clientList.length === 0 && (
                  <div className="empty-state">
                    <p>Aucun client trouvé</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Salary Screen */}
        {currentScreen === 'salary' && (
          <div className="screen-container">
            <div className="form-card">
              <h2 className="screen-title">Mon Salaire</h2>
              
              <div className="salary-container">
                <div className="salary-card">
                  <div className="salary-header">
                    <FiDollarSign size={32} className="salary-icon" />
                    <h3>Rémunération</h3>
                  </div>
                  
                  <div className="salary-details">
                    <div className="salary-item">
                      <span>Clients validés:</span>
                      <span className="salary-value">{validatedClients.length}</span>
                    </div>
                    
                    <div className="salary-item">
                      <span>Clients en attente:</span>
                      <span className="salary-value">{pendingClients.length}</span>
                    </div>
                    
                    <div className="salary-item">
                      <span>Commission par client:</span>
                      <span className="salary-value">{COMMISSION_PER_CLIENT} FCFA</span>
                    </div>
                    
                    <div className="salary-divider"></div>
                    
                    <div className="salary-item total">
                      <span>Salaire total:</span>
                      <span className="salary-value">{calculateSalary(clientList)} FCFA</span>
                    </div>
                  </div>
                </div>
                
                <div className="salary-periods">
                  <div className="period-card">
                    <div className="period-header">
                      <FiCalendar size={20} />
                      <h4>Aujourd'hui</h4>
                    </div>
                    <div className="period-stats">
                      <div>
                        <p className="period-label">Validés:</p>
                        <p className="period-count">
                          {validatedClients.filter(client => {
                            const date = new Date(client.validatedAt);
                            return date.toDateString() === new Date().toDateString();
                          }).length}
                        </p>
                      </div>
                      <div>
                        <p className="period-label">En attente:</p>
                        <p className="period-count">
                          {pendingClients.filter(client => {
                            const date = new Date(client.createdAt);
                            return date.toDateString() === new Date().toDateString();
                          }).length}
                        </p>
                      </div>
                    </div>
                    <p className="period-amount">
                      {validatedClients.filter(client => {
                        const date = new Date(client.validatedAt);
                        return date.toDateString() === new Date().toDateString();
                      }).length * COMMISSION_PER_CLIENT} FCFA
                    </p>
                  </div>
                  
                  <div className="period-card">
                    <div className="period-header">
                      <FiCalendar size={20} />
                      <h4>Ce mois</h4>
                    </div>
                    <div className="period-stats">
                      <div>
                        <p className="period-label">Validés:</p>
                        <p className="period-count">
                          {validatedClients.filter(client => {
                            const date = new Date(client.validatedAt);
                            const now = new Date();
                            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                          }).length}
                        </p>
                      </div>
                      <div>
                        <p className="period-label">En attente:</p>
                        <p className="period-count">
                          {pendingClients.filter(client => {
                            const date = new Date(client.createdAt);
                            const now = new Date();
                            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                          }).length}
                        </p>
                      </div>
                    </div>
                    <p className="period-amount">
                      {validatedClients.filter(client => {
                        const date = new Date(client.validatedAt);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length * COMMISSION_PER_CLIENT} FCFA
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgentDashboard;