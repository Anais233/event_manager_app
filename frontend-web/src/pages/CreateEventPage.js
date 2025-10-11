import React, { useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './FormPage.css';

function CreateEventPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '', description: '', startDate: '', endDate: '', location: '', maxParticipants: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage(''); setError('');
    try {
      const dataToSend = { ...formData, maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined };
      const response = await axiosInstance.post('/events', dataToSend);
      setMessage(response.data.message || 'Événement créé avec succès !');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la création de l\'événement.');
    }
  };

  return (
    <div className="form-container">
      <h2>Créer un Nouvel Événement</h2>
      <form onSubmit={handleSubmit} className="event-form">
        <input type="text" name="name" placeholder="Nom de l'événement" value={formData.name} onChange={handleChange} required />
        <textarea name="description" placeholder="Description de l'événement" value={formData.description} onChange={handleChange} rows="4" />
        <label>Date de début:</label>
        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
        <label>Date de fin (optionnel):</label>
        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
        <input type="text" name="location" placeholder="Lieu" value={formData.location} onChange={handleChange} />
        <input type="number" name="maxParticipants" placeholder="Nombre max de participants (optionnel)" value={formData.maxParticipants} onChange={handleChange} min="1" />
        <button type="submit">Créer l'événement</button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default CreateEventPage;
