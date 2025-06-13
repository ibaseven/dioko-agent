import React, { useState } from 'react';
import './AdminDashboard.css';
import logo from '../assets/logo.png';
import API_BASE_URL from '../config'; 

const API_BASE = `${process.env.REACT_APP_API_URL}`;

const AdminDashboard = () => {
  const [currentScreen, setCurrentScreen] = useState('validation');
  const [formStep, setFormStep] = useState(1);
  
  // Agent creation states
  const [agentName, setAgentName] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentPassword, setAgentPassword] = useState('');
  const [agentMessage, setAgentMessage] = useState('');

  // Client validation states
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  // Lists states
  const [agentsList, setAgentsList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [clientsOfAgent, setClientsOfAgent] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Filter states
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
        if (response.ok) {
          setValidationMessage('Code OTP envoyé. Veuillez entrer le code.');
          setFormStep(2);
        } else {
          setValidationMessage(data.message || 'Erreur');
        }
      } catch (err) {
        setValidationMessage('Erreur serveur');
      }
    } else {
      // Validate OTP
      setValidationMessage('Validation en cours...');
      try {
        const response = await fetch(`${API_BASE}/api/client/confirm-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            phone: clientPhone,
            otp: otp,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          setValidationMessage('✅ Client validé avec succès !');
          setFormStep(1);
          setClientFirstName('');
          setClientLastName('');
          setClientPhone('');
          setOtp('');
        } else {
          setValidationMessage(data.message || 'Code OTP incorrect');
        }
      } catch (err) {
        setValidationMessage('Erreur serveur');
      }
    }
  };

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
        alert(data.message || "Erreur chargement agents");
      }
    } catch (err) {
      alert("Erreur serveur agents");
    }
  };

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
        alert(data.message || "Erreur chargement clients");
      }
    } catch (err) {
      alert("Erreur serveur clients");
    }
  };

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
        setCurrentScreen('agent-clients');
      } else {
        alert(data.message || "Erreur chargement des clients de l'agent");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
  };

  const toggleAgentStatus = async (agentId) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/agents/${agentId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        fetchAgents(); // Refresh list
      } else {
        alert(data.message || "Erreur changement statut");
      }
    } catch (err) {
      alert("Erreur serveur");
    }
  };

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

  const filteredAgents = agentsList.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone.includes(searchTerm)
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <img src={logo} alt="DIOKO" className="logo-img" />
            <div className="app-title">DIOKO</div>
            <div className="user-badge">ADMIN</div>
          </div>
        </div>
      </header>
      
      {/* Navigation */}
      <nav className="app-nav">
        <button 
          className={`nav-item ${currentScreen === 'validation' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('validation')}
        >
          <span className="nav-icon">✓</span>
          <span className="nav-text">Validation</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'agents' ? 'active' : ''}`}
          onClick={() => {
            setCurrentScreen('agents');
            fetchAgents();
          }}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-text">Agents</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'clients' ? 'active' : ''}`}
          onClick={() => {
            setCurrentScreen('clients');
            fetchClients();
          }}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-text">Clients</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'create-agent' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('create-agent')}
        >
          <span className="nav-icon">➕</span>
          <span className="nav-text">Nouvel Agent</span>
        </button>
        <button className="nav-item" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
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
                <div className="form-container">
                  <div className="input-group">
                    <label className="input-label">Prénom du client</label>
                    <input 
                      type="text" 
                      value={clientFirstName}
                      onChange={(e) => setClientFirstName(e.target.value)}
                      className="form-input"
                      placeholder="Ex: Jean"
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
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">Numéro de téléphone</label>
                    <input 
                      type="tel" 
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="form-input"
                      placeholder="Ex: 077123456"
                    />
                  </div>
                  
                  <button 
                    onClick={handleCreateClient}
                    className="btn-primary"
                  >
                    Envoyer OTP
                  </button>
                </div>
              ) : (
                <div className="form-container">
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
                    />
                  </div>
                  
                  <button 
                    onClick={handleCreateClient}
                    className="btn-primary"
                  >
                    Valider le client
                  </button>
                  
                  <button 
                    onClick={() => setFormStep(1)}
                    className="btn-secondary"
                  >
                    Retour
                  </button>
                </div>
              )}
              {validationMessage && (
                <div className="message-container">
                  <p className={`message ${validationMessage.includes('✅') ? 'success' : 'info'}`}>
                    {validationMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Agent Screen */}
        {currentScreen === 'create-agent' && (
          <div className="screen-container">
            <div className="form-card">
              <h2 className="screen-title">Créer un Agent</h2>
              
              <div className="form-container">
                <div className="input-group">
                  <label className="input-label">Nom complet</label>
                  <input 
                    type="text" 
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="form-input"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Numéro de téléphone</label>
                  <input 
                    type="tel" 
                    value={agentPhone}
                    onChange={(e) => setAgentPhone(e.target.value)}
                    className="form-input"
                    placeholder="Ex: 077123456"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Mot de passe</label>
                  <input 
                    type="password" 
                    value={agentPassword}
                    onChange={(e) => setAgentPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                  />
                </div>
                
                <button 
                  onClick={handleCreateAgent}
                  className="btn-primary"
                >
                  Créer l'agent
                </button>
              </div>
              
              {agentMessage && (
                <div className="message-container">
                  <p className={`message ${agentMessage.includes('✅') ? 'success' : 'info'}`}>
                    {agentMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Agents Screen */}
        {currentScreen === 'agents' && (
          <div className="screen-container">
            <div className="list-card">
              <div className="list-header">
                <h2 className="screen-title">Gestion des Agents</h2>
              </div>
              
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
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent, index) => (
                      <tr key={index}>
                        <td>{agent.name}</td>
                        <td>{agent.phone}</td>
                        <td>
                          <span className={`status-badge ${agent.isBlocked ? 'blocked' : 'active'}`}>
                            {agent.isBlocked ? 'Bloqué' : 'Actif'}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => fetchClientsOfAgent(agent._id, agent.name)}
                            className="btn-action view"
                          >
                            Voir
                          </button>
                          <button 
                            onClick={() => toggleAgentStatus(agent._id)}
                            className="btn-action toggle"
                          >
                            {agent.isBlocked ? 'Activer' : 'Bloquer'}
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

        {/* Clients Screen */}
        {currentScreen === 'clients' && (
          <div className="screen-container">
            <div className="list-card">
              <h2 className="screen-title">Liste des Clients</h2>
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
                </select>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Date de validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterClients().map((client, index) => (
                      <tr key={index}>
                        <td>{client.firstName} {client.lastName}</td>
                        <td>{client.phone}</td>
                        <td>{new Date(client.validatedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
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

        {/* Agent Clients Screen */}
        {currentScreen === 'agent-clients' && (
          <div className="screen-container">
            <div className="list-card">
              <div className="list-header">
                <button 
                  onClick={() => setCurrentScreen('agents')}
                  className="btn-back"
                >
                  ← Retour
                </button>
                <h2 className="screen-title">Clients de {selectedAgent}</h2>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Date de validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientsOfAgent.map((client, index) => (
                      <tr key={index}>
                        <td>{client.firstName} {client.lastName}</td>
                        <td>{client.phone}</td>
                        <td>{client.validatedAt ? new Date(client.validatedAt).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {clientsOfAgent.length === 0 && (
                  <div className="empty-state">
                    <p>Aucun client pour cet agent</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;