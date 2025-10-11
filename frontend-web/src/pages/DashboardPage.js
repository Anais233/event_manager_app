import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EventList from '../components/EventList';
import axiosInstance from '../api/axiosInstance';
import './Dashboard.css';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get('/auth/me'); // ✅ corrigé
        setUser(res.data);
      } catch (err) {
        console.error(err);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  if (!user) return <p>Chargement...</p>;

  return (
    <div className="dashboard-page">
      <h2>Bienvenue sur votre Tableau de Bord, {user.first_name} !</h2>
      <p>Rôle : {user.role}</p>

      <Link to="/create-event" className="create-event-button">Créer un nouvel événement</Link>

      {(user.role === 'super_admin' || user.role === 'admin_org') && (
        <Link to="/admin/users" className="manage-users-link">Gestion des utilisateurs</Link>
      )}

      <EventList />
    </div>
  );
}

export default DashboardPage;