import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import './FormPage.css';

function EditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name:'', description:'', startDate:'', endDate:'', location:'', maxParticipants:'' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await axiosInstance.get(`/events/${id}`);
        const eventData = response.data.event;
        setFormData({
          name: eventData.name || '',
          description: eventData.description || '',
          startDate: eventData.startDate ? new Date(eventData.startDate).toISOString().split('T')[0] : '',
          endDate: eventData.endDate ? new Date(eventData.endDate).toISOString().split('T')[0] : '',
          location: eventData.location || '',
          maxParticipants: eventData.maxParticipants?.toString() || ''
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Échec du chargement de l\'événement.');
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setMessage(''); setError('');
    try {
      const dataToSend = { ...formData, maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined };
      const response = await axiosInstance.put(`/events/${id}`, dataToSend);
      setMessage(response.data.message || 'Événement mis à jour avec succès !');
      navigate(`/events/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Échec de la mise à jour de l\'événement.');
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="form-container">
      <h2>Modifier l'Événement</h2>
      <form onSubmit={handleSubmit} className="event-form">
        <input type="text" name="name" placeholder="Nom de l'événement" value={formData.name} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} rows="4" />
        <label>Date de début:</label>
        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
        <label>Date de fin (optionnel):</label>
        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
        <input type="text" name="location" placeholder="Lieu" value={formData.location} onChange={handleChange} />
        <input type="number" name="maxParticipants" placeholder="Nombre max de participants (optionnel)" value={formData.maxParticipants} onChange={handleChange} min="1" />
        <button type="submit">Mettre à jour</button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default EditEventPage;
