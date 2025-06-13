import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import logo from "../assets/logo.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation logique : un seul champ de connexion doit être rempli
    if ((email && phone) || (!email && !phone)) {
      setIsLoading(false);
      return setError("Veuillez utiliser soit l'email (admin), soit le téléphone (agent)");
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        email: email || null,
        phone: phone || null,
        password,
      });

      const { token, role, id, name } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("userId", id);
      localStorage.setItem("name", name);

      // Redirection basée sur le rôle
      navigate(role === "admin" ? "/admin" : "/agent");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e, field) => {
    setError("");
    if (field === "email") {
      setEmail(e.target.value);
      if (e.target.value) setPhone("");
    } else if (field === "phone") {
      setPhone(e.target.value);
      if (e.target.value) setEmail("");
    } else {
      setPassword(e.target.value);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="Logo" className="login-logo" />
          <h1 className="login-title">Connexion</h1>
          <p className="login-subtitle">Accédez à votre espace professionnel</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className={`form-group ${email ? "active" : ""}`}>
            <label>Email Administrateur</label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleInputChange(e, "email")}
              placeholder="admin@example.com"
              disabled={!!phone}
              className={phone ? "disabled" : ""}
            />
          </div>

          <div className="form-separator">
            <span>OU</span>
          </div>

          <div className={`form-group ${phone ? "active" : ""}`}>
            <label>Téléphone Agent</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handleInputChange(e, "phone")}
              placeholder="Ex: 077123456"
              disabled={!!email}
              className={email ? "disabled" : ""}
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => handleInputChange(e, "password")}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className={`login-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;