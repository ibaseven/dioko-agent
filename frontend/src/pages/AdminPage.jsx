import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import logo from '../assets/logo.png';

const API_BASE = 'http://localhost:5000';
const COMMISSION_PER_CLIENT = 160; // 160 FCFA par client

const AdminDashboard = () => {
  // États de navigation
  const [currentScreen, setCurrentScreen] = useState('validation');
  const [formStep, setFormStep] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // États création agent
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [agentMessage, setAgentMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);  

  // États validation client
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  // États listes
  const [agentsList, setAgentsList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [clientsOfAgent, setClientsOfAgent] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [loadingAgentId, setLoadingAgentId] = useState(null);

  // États filtres
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Fonctions utilitaires
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const handleNavClick = (screen) => {
    setCurrentScreen(screen);
    setIsMenuOpen(false);
  };

  // Calcul des données salariales avec gestion du mois sélectionné
  const calculateAgentSalaryData = (clients, month = selectedMonth, year = selectedYear) => {
    const validatedClients = clients.filter(client => {
      if (!client.validatedAt) return false;
      const date = new Date(client.validatedAt);
      return date.getMonth() === month && 
             date.getFullYear() === year;
    });

    // Les clients en attente sont ceux non validés (peu importe le mois)
    const pendingClients = clients.filter(client => !client.validatedAt);

    const currentSalary = validatedClients.length * COMMISSION_PER_CLIENT;
    const potentialSalary = (validatedClients.length + pendingClients.length) * COMMISSION_PER_CLIENT;

    return {
      currentSalary,
      potentialSalary,
      validatedClients: validatedClients.length,
      pendingClients: pendingClients.length,
      validatedClientsData: validatedClients,
      pendingClientsData: pendingClients,
      month,
      year
    };
  };

  // Obtenir le nom du mois
  const getMonthName = (month) => {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                   'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[month];
  };

  // Liste des mois disponibles (jusqu'au mois en cours)
  const getAvailableMonths = () => {
    const currentDate = new Date();
    const months = [];
    
    for (let year = 2023; year <= currentDate.getFullYear(); year++) {
      const maxMonth = year === currentDate.getFullYear() ? currentDate.getMonth() : 11;
      
      for (let month = 0; month <= maxMonth; month++) {
        months.push({
          month,
          year,
          label: `${getMonthName(month)} ${year}`
        });
      }
    }
    
    return months.reverse(); // Du plus récent au plus ancien
  };

  // Création d'un agent
  const handleCreateAgent = async (e) => {
    e.preventDefault();
    setAgentMessage('Création en cours...');
    try {
      const response = await fetch(`${API_BASE}/api/admin/create-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: agentName,
          phone: agentPhone,
          password: agentPassword,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAgentMessage('✅ Agent créé avec succès !');
        setAgentName('');
        setAgentPhone('');
        setAgentPassword('');
        fetchAgents();
      } else {
        setAgentMessage(data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      setAgentMessage('Erreur serveur');
    }
  };

  // Validation client
 // Validation client - VERSION CORRIGÉE
const handleCreateClient = async (e) => {
  e.preventDefault();
  if (formStep === 1) {
    setValidationMessage('Envoi des infos client...');
    try {
      const response = await fetch(`${API_BASE}/api/client/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          firstName: clientFirstName,
          lastName: clientLastName,
          phone: clientPhone,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la validation');
      }

      setValidationMessage('Code OTP envoyé. Veuillez entrer le code.');
      
      // Stockage sécurisé des données du client en attente
      localStorage.setItem('pendingClient', JSON.stringify({
        firstName: clientFirstName,
        lastName: clientLastName,
        phone: clientPhone,
        _id: data.clientId || data._id // Gère les deux formats de réponse
      }));
      
      setFormStep(2);
    } catch (err) {
      console.error('Erreur validation client:', err);
      setValidationMessage(err.message || 'Erreur serveur');
    }
  } else {
    handleValidateOtp(e);
  }
};

  // Validation OTP
const handleValidateOtp = async (e) => {
  e.preventDefault();
  setValidationMessage('Validation en cours...');
  
  try {
    const pendingClientStr = localStorage.getItem('pendingClient');
    if (!pendingClientStr) {
      throw new Error('Session client introuvable');
    }

    const pendingClient = JSON.parse(pendingClientStr);
    
    const response = await fetch(`${API_BASE}/api/client/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        clientId: pendingClient._id,
        phone: pendingClient.phone,
        otp: otp,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Code OTP incorrect');
    }

    // Succès
    setValidationMessage('✅ Client validé avec succès !');
    localStorage.removeItem('pendingClient');
    setFormStep(1);
    setClientFirstName('');
    setClientLastName('');
    setClientPhone('');
    setOtp('');
    fetchClients();
    
  } catch (err) {
    console.error('Erreur validation OTP:', err);
    setValidationMessage(err.message || 'Erreur serveur');
  }
};

  // Récupération des agents
  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/agents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setAgentsList(data);
      } else {
        console.error(data.message || "Erreur chargement agents");
      }
    } catch (err) {
      console.error("Erreur serveur agents");
    }
  };

  // Récupération des clients
  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/client/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setClientsList(data);
      } else {
        console.error(data.message || "Erreur chargement clients");
      }
    } catch (err) {
      console.error("Erreur serveur clients");
    }
  };

  // Clients par agent
  const fetchClientsOfAgent = async (agentId, agentName) => {
    try {
      const response = await fetch(`${API_BASE}/api/client/agent/${agentId}/clients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setClientsOfAgent(data);
        setSelectedAgent(agentName);
        setSelectedAgentId(agentId);
        setCurrentScreen('agent-clients');
      } else {
        console.error(data.message || "Erreur chargement clients agent");
      }
    } catch (err) {
      console.error("Erreur serveur");
    }
  };

  // Salaire agent
  const viewAgentSalary = async (agentId, agentName) => {
    try {
      const response = await fetch(`${API_BASE}/api/client/agent/${agentId}/clients`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setClientsOfAgent(data);
        setSelectedAgent(agentName);
        setSelectedAgentId(agentId);
        setCurrentScreen('agent-salary');
      } else {
        console.error(data.message || "Erreur chargement salaire agent");
      }
    } catch (err) {
      console.error("Erreur serveur");
    }
  };

  // Changement statut agent - VERSION AMÉLIORÉE
  const toggleAgentStatus = async (agentId) => {
    setLoadingAgentId(agentId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/agents/${agentId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        // Mise à jour optimiste avec les données du serveur
        setAgentsList(agentsList.map(agent => 
          agent._id === agentId ? { ...agent, isActive: data.agent.isActive } : agent
        ));
        setAgentMessage(`Agent ${data.agent.isActive ? 'activé' : 'bloqué'} avec succès`);
        setTimeout(() => setAgentMessage(''), 3000);
      } else {
        console.error(data.message || "Erreur changement statut");
        setAgentMessage(data.message || "Erreur lors du changement de statut");
        setTimeout(() => setAgentMessage(''), 3000);
        // Recharger les agents pour synchroniser
        fetchAgents();
      }
    } catch (err) {
      console.error("Erreur serveur:", err);
      setAgentMessage("Erreur de connexion au serveur");
      setTimeout(() => setAgentMessage(''), 3000);
    } finally {
      setLoadingAgentId(null);
    }
  };

    // Fonction pour supprimer un agent
  const deleteAgent = async (agentId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet agent ?")) {
      return;
    }

    setLoadingAgentId(agentId);
    try {
      const response = await fetch(`${API_BASE}/api/admin/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setAgentMessage('✅ Agent supprimé avec succès');
        setTimeout(() => setAgentMessage(''), 3000);
        fetchAgents(); // Recharger la liste des agents
      } else {
        setAgentMessage(data.message || "Erreur lors de la suppression");
        setTimeout(() => setAgentMessage(''), 3000);
      }
    } catch (err) {
      setAgentMessage("Erreur de connexion au serveur");
      setTimeout(() => setAgentMessage(''), 3000);
    } finally {
      setLoadingAgentId(null);
    }
  };
  // Filtrage clients
  const filterClients = () => {
    const now = new Date();
    return clientsList.filter(client => {
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
      }
      return true;
    }).filter(client => {
      const name = `${client.firstName} ${client.lastName}`.toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || client.phone.includes(searchTerm);
    });
  };

  // Filtrage agents
  const filteredAgents = agentsList.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone.includes(searchTerm)
  );

  // Déconnexion
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  // Effet initial
  useEffect(() => {
    if (currentScreen === 'agents' || currentScreen === 'salaries') {
      fetchAgents();
    }
    if (currentScreen === 'clients' || currentScreen === 'validation') {
      fetchClients();
    }
  }, [currentScreen]);

  return (
    <div className="app-container">
      {/* En-tête */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <img src={logo} alt="DIOKO" className="logo-img" />
            <div className="app-title">DIOKO</div>
            <div className="user-badge">ADMIN</div>
          </div>
          <button className="menu-toggle" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className={`app-nav ${isMenuOpen ? 'open' : ''}`}>
        <button 
          className={`nav-item ${currentScreen === 'validation' ? 'active' : ''}`}
          onClick={() => handleNavClick('validation')}
        >
          <span className="nav-icon">✓</span>
          <span className="nav-text">Validation</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'agents' ? 'active' : ''}`}
          onClick={() => handleNavClick('agents')}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-text">Agents</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'clients' ? 'active' : ''}`}
          onClick={() => handleNavClick('clients')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-text">Clients</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'salaries' ? 'active' : ''}`}
          onClick={() => handleNavClick('salaries')}
        >
          <span className="nav-icon">💰</span>
          <span className="nav-text">Salaires</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'create-agent' ? 'active' : ''}`}
          onClick={() => handleNavClick('create-agent')}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-text">Nouvel Agent</span>
        </button>
        <button className="nav-item" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Déconnexion</span>
        </button>
      </nav>
      
      {/* Contenu principal */}
      <main className="app-main">
        {/* Message de statut global */}
        {agentMessage && (
          <div className={`global-message ${agentMessage.includes('✅') || agentMessage.includes('succès') ? 'success' : 'error'}`}>
            {agentMessage}
          </div>
        )}

        {/* Écran de validation */}
        {currentScreen === 'validation' && (
          <div className="screen-container">
            <div className="form-card">
              <h2 className="screen-title">Validation Client</h2>
              
              {formStep === 1 ? (
                <form onSubmit={handleCreateClient} className="form-container">
                  <div className="input-group">
                    <label>Prénom</label>
                    <input 
                      type="text" 
                      value={clientFirstName}
                      onChange={(e) => setClientFirstName(e.target.value)}
                      placeholder="Ex: Jean"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Nom</label>
                    <input 
                      type="text" 
                      value={clientLastName}
                      onChange={(e) => setClientLastName(e.target.value)}
                      placeholder="Ex: Dupont"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Téléphone</label>
                    <input 
                      type="tel" 
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: 077123456"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn-primary">
                    Envoyer OTP
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCreateClient} className="form-container">
                  <div className="otp-info">
                    <p>Code envoyé au:</p>
                    <p className="phone-number">{clientPhone}</p>
                  </div>
                  
                  <div className="input-group">
                    <label>Code OTP</label>
                    <input 
                      type="text" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Ex: 123456"
                      required
                    />
                  </div>
                  
                  <button type="submit" className="btn-primary">
                    Valider
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setFormStep(1)}
                    className="btn-secondary"
                  >
                    Retour
                  </button>
                </form>
              )}
              
              {validationMessage && (
                <div className={`message ${validationMessage.includes('✅') ? 'success' : 'error'}`}>
                  {validationMessage}
                </div>
              )}
            </div>
          </div>
        )}

      {/* Écran création agent */}
{currentScreen === 'create-agent' && (
  <div className="screen-container">
    <div className="form-card">
      <h2 className="screen-title">Nouvel Agent</h2>
      
      <form onSubmit={handleCreateAgent} className="form-container">
        <div className="input-group">
          <label>Nom complet</label>
          <input 
            type="text" 
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Ex: Jean Dupont"
            required
          />
        </div>
        
        <div className="input-group">
          <label>Téléphone</label>
          <input 
            type="tel" 
            value={agentPhone}
            onChange={(e) => setAgentPhone(e.target.value)}
            placeholder="Ex: 077123456"
            required
          />
        </div>
        
        <div className="input-group">
          <label>Mot de passe</label>
          <div className="password-input-container">
            <input 
              type={showPassword ? "text" : "password"} 
              value={agentPassword}
              onChange={(e) => setAgentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-password"
            >
              {showPassword ? (
                <span className="eye-icon">👁️</span> // Icône "œil barré" ou texte "Cacher"
              ) : (
                <span className="eye-icon">👁️</span> // Icône "œil" ou texte "Afficher"
              )}
            </button>
          </div>
          {agentPassword && (
            <div className="password-hint">
              Mot de passe visible : {showPassword ? agentPassword : '••••••••'}
            </div>
          )}
        </div>
        
        <button type="submit" className="btn-primary">
          Créer l'agent
        </button>
      </form>
      
      {agentMessage && (
        <div className={`message ${agentMessage.includes('✅') ? 'success' : 'error'}`}>
          {agentMessage}
        </div>
      )}
    </div>
  </div>
)}
        
       {/* Écran agents */}
      {currentScreen === 'agents' && (
        <div className="screen-container">
          <div className="list-card">
            <div className="list-header">
              <h2>Gestion des Agents</h2>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Téléphone</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgents.map((agent) => (
                    <tr key={agent._id}>
                      <td>{agent.name}</td>
                      <td>{agent.phone}</td>
                      <td>
                        <span className={`status-badge ${agent.isActive ? 'active' : 'blocked'}`}>
                          {agent.isActive ? 'Actif' : 'Bloqué'}
                        </span>
                      </td>
                      <td className="actions">
                        <button 
                          onClick={() => viewAgentSalary(agent._id, agent.name)}
                          className="btn-action"
                        >
                          Voir Salaire
                        </button>
                        <button 
                          onClick={() => toggleAgentStatus(agent._id)}
                          className={`btn-action ${agent.isActive ? 'block' : 'activate'}`}
                          disabled={loadingAgentId === agent._id}
                        >
                          {loadingAgentId === agent._id ? (
                            'Chargement...'
                          ) : (
                            agent.isActive ? 'Bloquer' : 'Activer'
                          )}
                        </button>
                        <button 
                          onClick={() => deleteAgent(agent._id)}
                          className="btn-action delete"
                          disabled={loadingAgentId === agent._id}
                        >
                          {loadingAgentId === agent._id ? 'Chargement...' : 'Supprimer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAgents.length === 0 && (
                <div className="empty-state">
                  <p>Aucun agent trouvé</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Écran clients */}
        {currentScreen === 'clients' && (
          <div className="screen-container">
            <div className="list-card">
              <div className="list-header">
                <h2>Tous les Clients</h2>
                <div className="filter-controls">
                  <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Tous</option>
                    <option value="day">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Agent</th>
                      <th>Date</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterClients().map((client, index) => {
                      const agent = agentsList.find(a => a._id === client.agentId);
                      return (
                        <tr key={index}>
                          <td>{client.firstName} {client.lastName}</td>
                          <td>{client.phone}</td>
                          <td>{agent ? agent.name : 'N/A'}</td>
                          <td>{new Date(client.validatedAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${client.validatedAt ? 'validated' : 'pending'}`}>
                              {client.validatedAt ? 'Validé' : 'En attente'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filterClients().length === 0 && (
                  <div className="empty-state">
                    <p>Aucun client trouvé</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Écran salaires */}
        {currentScreen === 'salaries' && (
          <div className="screen-container">
            <div className="list-card">
              <h2>Salaires Mensuels</h2>
              
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Rechercher un agent..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr key={agent._id}>
                        <td>
                          <strong>{agent.name}</strong>
                          <br />
                          <small>{agent.phone}</small>
                        </td>
                        <td>
                          <button 
                            onClick={() => viewAgentSalary(agent._id, agent.name)}
                            className="btn-action"
                          >
                            Voir Détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Écran salaire d'un agent */}
        {currentScreen === 'agent-salary' && (
          <div className="screen-container">
            <div className="list-card">
              <div className="list-header">
                <button onClick={() => setCurrentScreen('salaries')} className="btn-back">
                  ← Retour aux Salaires
                </button>
                <div className="month-selector">
                  <button 
                    onClick={() => setShowMonthPicker(!showMonthPicker)}
                    className="month-button"
                  >
                    {getMonthName(selectedMonth)} {selectedYear}
                    <span className="arrow">▼</span>
                  </button>
                  
                  {showMonthPicker && (
                    <div className="month-picker">
                      {getAvailableMonths().map((m, index) => (
                        <button
                          key={index}
                          className={`month-option ${selectedMonth === m.month && selectedYear === m.year ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedMonth(m.month);
                            setSelectedYear(m.year);
                            setShowMonthPicker(false);
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(() => {
                const salaryData = calculateAgentSalaryData(clientsOfAgent, selectedMonth, selectedYear);
                const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();
                
                return (
                  <>
                    <div className="salary-summary-cards">
                      <div className="salary-card current">
                        <h3>Salaire {isCurrentMonth ? 'en Cours' : 'du Mois'}</h3>
                        <p className="amount">{salaryData.currentSalary} FCFA</p>
                        <p className="detail">{salaryData.validatedClients} clients validés × {COMMISSION_PER_CLIENT} FCFA</p>
                      </div>
                      
                      {isCurrentMonth && (
                        <div className="salary-card potential">
                          <h3>Salaire Potentiel</h3>
                          <p className="amount">{salaryData.potentialSalary} FCFA</p>
                          <p className="detail">{(salaryData.validatedClients + salaryData.pendingClients)} clients × {COMMISSION_PER_CLIENT} FCFA</p>
                        </div>
                      )}
                    </div>

                    <div className="clients-section">
                      <h3>Détail des Clients</h3>
                      
                      <div className="tabs">
                        <button className="tab active">Validés ({salaryData.validatedClients})</button>
                        {isCurrentMonth && (
                          <button className="tab">En Attente ({salaryData.pendingClients})</button>
                        )}
                      </div>

                      <div className="clients-list">
                        {salaryData.validatedClientsData.map((client, index) => (
                          <div key={index} className="client-item validated">
                            <div className="client-info">
                              <span className="name">{client.firstName} {client.lastName}</span>
                              <span className="phone">{client.phone}</span>
                            </div>
                            <div className="client-meta">
                              <span className="date">
                                {new Date(client.validatedAt).toLocaleDateString()}
                              </span>
                              <span className="commission">+{COMMISSION_PER_CLIENT} FCFA</span>
                            </div>
                          </div>
                        ))}

                        {isCurrentMonth && salaryData.pendingClientsData.map((client, index) => (
                          <div key={`pending-${index}`} className="client-item pending">
                            <div className="client-info">
                              <span className="name">{client.firstName} {client.lastName}</span>
                              <span className="phone">{client.phone}</span>
                            </div>
                            <div className="client-meta">
                              <span className="status">En attente</span>
                              <span className="commission potential">+{COMMISSION_PER_CLIENT} FCFA</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Pied de page */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} DIOKO - Tous droits réservés</p>
          <p>Version 1.0.0</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;