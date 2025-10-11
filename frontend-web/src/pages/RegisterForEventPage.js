// frontend/src/pages/RegisterForEventPage.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './FormPage.css';

function RegisterForEventPage() {
  const { id } = useParams(); // ID de l'événement depuis l'URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    city: '',
    country: '',
    phone: '',
    arrivalDate: '',
    departureDate: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // Préparation des données pour le backend
      const dataToSend = {
        ...formData,
        arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate).toISOString() : null,
        departureDate: formData.departureDate ? new Date(formData.departureDate).toISOString() : null,
      };

      const response = await axiosInstance.post(`/events/${id}/register`, dataToSend);

      setMessage(response.data.message || 'Inscription réussie !');
      setLoading(false);

      // Réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        city: '',
        country: '',
        phone: '',
        arrivalDate: '',
        departureDate: '',
      });

      // Redirection optionnelle vers la page de détails de l’événement
      // setTimeout(() => navigate(`/events/${id}`), 2000);

    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Échec de l\'inscription. Veuillez réessayer.');
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Inscription à l'événement</h2>
      {loading && <p>Envoi de votre inscription...</p>}
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="event-form">
        <input
          type="text"
          name="firstName"
          placeholder="Prénom"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Nom"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="city"
          placeholder="Ville"
          value={formData.city}
          onChange={handleChange}
        />
        <input
          type="text"
          name="country"
          placeholder="Pays"
          value={formData.country}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Téléphone"
          value={formData.phone}
          onChange={handleChange}
        />
        <label>📅 Date d'arrivée</label>
        <input
          type="date"
          name="arrivalDate"
          value={formData.arrivalDate}
          onChange={handleChange}
        />
        <label>📅 Date de départ</label>
        <input
          type="date"
          name="departureDate"
          value={formData.departureDate}
          onChange={handleChange}
        />

        <button type="submit" disabled={loading}>S'inscrire</button>
      </form>

      <button onClick={() => navigate(-1)} className="back-button">Retour</button>
    </div>
  );
}

export default RegisterForEventPage;