import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import './EventList.css'; // Nous allons créer ce fichier CSS
import { Link } from 'react-router-dom';

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get('/events'); // Appel à la route GET /api/events
        setEvents(response.data.events);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching events:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load events.');
        setLoading(false);
      }
    };

    fetchEvents();
  }, []); // Le tableau vide assure que l'effet ne s'exécute qu'une fois au montage du composant

  if (loading) {
    return <p>Chargement des événements...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="event-list-container">
      <h3>Mes Événements</h3>
      {events.length === 0 ? (
        <p>Aucun événement trouvé. Créez-en un nouveau !</p>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id} className="event-item"> {/* Chaque LI est un ITEM de la grille */}
                <Link to={`/events/${event.id}`} className="event-item-link"> {/* Ce lien englobe le contenu de la carte */}
                  <h4>{event.name}</h4>
                  <p>{event.description}</p>
                  <p>Date: {new Date(event.startDate).toLocaleDateString()} - {event.endDate ? new Date(event.endDate).toLocaleDateString() : 'N/A'}</p>
                  <p>Lieu: {event.location || 'Non spécifié'}</p>
                </Link>
              </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default EventList;