// frontend/src/pages/EventDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { QRCodeCanvas } from 'qrcode.react';
import './EventDetailPage.css';

function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [participantQrCodeInput, setParticipantQrCodeInput] = useState('');
  const [userRole, setUserRole] = useState('');

  const [showSendInviteModal, setShowSendInviteModal] = useState(false);
  const [recipientEmailsInput, setRecipientEmailsInput] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUserRole('admin_org'); // ⚠️ en vrai, tu devras décoder le rôle du token
    }
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("ID de l'événement manquant.");
      return;
    }

    const fetchEventDetails = async () => {
      try {
        const eventResponse = await axiosInstance.get(`/events/${id}`);
        setEvent(eventResponse.data.event);

        if (userRole === 'admin_org' || userRole === 'employee_org') {
          const participantsResponse = await axiosInstance.get(`/events/${id}/participants`);
          setParticipants(participantsResponse.data.participants);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details or participants:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Échec du chargement des détails de l\'événement.');
        setLoading(false);
      }
    };

    if (userRole) {
      fetchEventDetails();
    }
  }, [id, userRole]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!participantQrCodeInput) {
      alert('Veuillez scanner ou entrer le QR Code du participant.');
      return;
    }
    try {
      const response = await axiosInstance.post(`/events/${id}/checkin`, { qrCodeData: participantQrCodeInput });
      alert(response.data.message);

      const participantsResponse = await axiosInstance.get(`/events/${id}/participants`);
      setParticipants(participantsResponse.data.participants);
      setParticipantQrCodeInput('');
    } catch (err) {
      console.error('Check-in error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Échec du check-in. Vérifiez le QR Code.');
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await axiosInstance.get(`/events/${id}/participants/export`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `participants-${id}.csv`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Échec de l\'exportation CSV.');
    }
  };

  const handleDeleteEvent = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.')) {
      try {
        await axiosInstance.delete(`/events/${id}`);
        alert('Événement supprimé avec succès !');
        navigate('/dashboard');
      } catch (err) {
        console.error('Error deleting event:', err.response?.data || err.message);
        alert(err.response?.data?.message || 'Échec de la suppression de l\'événement.');
      }
    }
  };

  const handleSendInvitations = async (e) => {
    e.preventDefault();
    setEmailStatus('');
    setSendingEmails(true);

    const emailsArray = recipientEmailsInput.split(/[\n,;]+/).map(email => email.trim()).filter(email => email !== '');

    if (emailsArray.length === 0) {
      setEmailStatus('Veuillez entrer au moins une adresse e-mail.');
      setSendingEmails(false);
      return;
    }

    try {
      const response = await axiosInstance.post(`/events/${id}/send-invites`, {
        recipientEmails: emailsArray,
        message: inviteMessage,
      });
      setEmailStatus(response.data.message);
      setRecipientEmailsInput('');
      setInviteMessage('');
      setTimeout(() => setShowSendInviteModal(false), 2000);
    } catch (err) {
      console.error('Erreur lors de l\'envoi des invitations:', err.response?.data || err.message);
      setEmailStatus(err.response?.data?.message || 'Échec de l\'envoi des invitations. Veuillez réessayer.');
    } finally {
      setSendingEmails(false);
    }
  };

 const handleValidateParticipant = async (participantId) => {
  try {
    const response = await axiosInstance.post(
      `/events/${id}/participants/${participantId}/validate`
    );
    alert(response.data.message);

    // 🔄 Rafraîchir la liste des participants
    const participantsResponse = await axiosInstance.get(`/events/${id}/participants`);
    setParticipants(participantsResponse.data.participants);
  } catch (err) {
    console.error('Erreur validation participant:', err.response?.data || err.message);
    alert(err.response?.data?.message || 'Échec de la validation.');
  }
};

  if (loading) return <p className="loading-message">Chargement des détails de l'événement...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!event) return <p className="error-message">Événement introuvable.</p>;

  return (
    <div className="event-detail-page">
      <button onClick={() => navigate('/dashboard')} className="back-button">Retour au Dashboard</button>
      <h2>Détails de l'Événement : {event.name}</h2>
      <p><strong>Description:</strong> {event.description}</p>
      <p><strong>Dates:</strong> {new Date(event.startDate).toLocaleDateString('fr-FR')} - {event.endDate ? new Date(event.endDate).toLocaleDateString('fr-FR') : 'N/A'}</p>
      <p><strong>Lieu:</strong> {event.location || 'Non spécifié'}</p>
      <p><strong>Participants Max:</strong> {event.maxParticipants || 'Illimité'}</p>

      <Link to={`/events/${event.id}/register`} className="register-event-button">S'inscrire à cet événement</Link>

      {(userRole === 'admin_org') && (
        <div className="event-actions">
          <Link to={`/events/${event.id}/edit`} className="edit-event-button">Modifier l'événement</Link>
          <button onClick={handleDeleteEvent} className="delete-event-button">Supprimer l'événement</button>
          <button onClick={() => setShowSendInviteModal(true)} className="send-invites-button">Envoyer des invitations</button>
        </div>
      )}

      {showSendInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Envoyer des invitations pour "{event.name}"</h3>
            <form onSubmit={handleSendInvitations}>
              <label htmlFor="recipientEmails">Adresses e-mail des destinataires :</label>
              <textarea
                id="recipientEmails"
                rows="5"
                value={recipientEmailsInput}
                onChange={(e) => setRecipientEmailsInput(e.target.value)}
                placeholder="ex: jean.dupont@email.com"
                required
              ></textarea>

              <label htmlFor="inviteMessage">Message personnalisé (optionnel) :</label>
              <textarea
                id="inviteMessage"
                rows="3"
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Ex: N'oubliez pas de vous inscrire rapidement !"
              ></textarea>

              {emailStatus && <p className={emailStatus.includes('succès') ? 'success-message' : 'error-message'}>{emailStatus}</p>}

              <div className="modal-actions">
                <button type="submit" disabled={sendingEmails}>
                  {sendingEmails ? 'Envoi en cours...' : 'Envoyer les invitations'}
                </button>
                <button type="button" onClick={() => setShowSendInviteModal(false)} disabled={sendingEmails}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {(userRole === 'admin_org' || userRole === 'employee_org') && (
        <>
          <div className="checkin-section">
            <h3>Check-in Participant</h3>
            <form onSubmit={handleCheckIn}>
              <input
                type="text"
                placeholder="Scanner ou entrer le QR Code du participant"
                value={participantQrCodeInput}
                onChange={(e) => setParticipantQrCodeInput(e.target.value)}
                required
              />
              <button type="submit">Check-in</button>
            </form>
          </div>

          <div className="participants-section">
            <h3>Participants ({participants.length})</h3>
            <button onClick={handleExportCsv} className="export-csv-button">Exporter en CSV</button>
            {participants.length === 0 ? (
              <p>Aucun participant inscrit pour cet événement.</p>
            ) : (
              <ul className="participants-list">
                {participants.map((p) => (
                  <li key={p.id} className={`participant-item ${p.checkedIn ? 'checked-in' : ''}`}>
                    <div className="participant-info">
                      <span>{p.firstName} {p.lastName} ({p.email})</span>
                      <span className={`status-tag ${p.status.toLowerCase()}`}>Status: {p.status}</span>
                      {p.checkedIn && <span className="checked-in-status">Arrivé le {new Date(p.checkedInAt).toLocaleString('fr-FR')}</span>}
                      {!p.checkedIn && <span className="not-checked-in-status">Non Arrivé</span>}
                    </div>

                    {p.status === "PENDING" && (
                      <button 
                        className="validate-button" 
                        style={{ backgroundColor: 'blue', color: 'white', marginTop: '5px' }}
                        onClick={() => handleValidateParticipant(p.id)}
                      >
                        Valider l’inscription
                      </button>
                    )}

                    {p.qrCodeData && p.status === "VALIDATED" && (
                      <div className="qrcode-container">
                        <QRCodeCanvas value={p.qrCodeData} size={80} level="H" />
                        <button
                          onClick={() => navigator.clipboard.writeText(p.qrCodeData)}
                          className="copy-qrcode-button"
                          title="Copier la donnée du QR code"
                        >
                          Copier QR
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default EventDetailPage;
