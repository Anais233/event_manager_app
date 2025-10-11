import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import './AuthPage.css';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'admin_org', organizationName: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      const response = await axiosInstance.post('/auth/register', formData);
      localStorage.setItem('token', response.data.token);
      setMessage(response.data.message || 'Inscription réussie');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Inscription</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleChange} required />
        <input type="text" name="firstName" placeholder="Prénom" value={formData.firstName} onChange={handleChange} required />
        <input type="text" name="lastName" placeholder="Nom" value={formData.lastName} onChange={handleChange} required />
        <input type="text" name="organizationName" placeholder="Nom de l'organisation (optionnel)" value={formData.organizationName} onChange={handleChange} />
        <button type="submit">S'inscrire</button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default RegisterPage;
