// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateEventPage from './pages/CreateEventPage';
import './App.css';
import './components/Navbar.css';
import { useNavigate } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import EventDetailPage from './pages/EventDetailPage';
import EditEventPage from './pages/EditEventPage';
import RegisterForEventPage from './pages/RegisterForEventPage'; // <--- NOUVEL IMPORT
import AdminUsersPage from './pages/AdminUsersPage';

// Composant de barre de navigation simple
function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">RWANDA IN FRANCE Event Manager</Link>
      </div>
      <ul className="navbar-nav">
        {!isAuthenticated ? (
          <>
            <li className="nav-item">
              <Link to="/register">S'inscrire</Link>
            </li>
            <li className="nav-item">
              <Link to="/login">Se connecter</Link>
            </li>
          </>
        ) : (
          <>
            <li className="nav-item">
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li className="nav-item">
              <button onClick={handleLogout} className="nav-button">Déconnexion</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <div className="App-content">
        <Routes>
          <Route path="/" element={
            <div className="home-page">
              <h1>Bienvenue dans Event Manager App !</h1>
              <p>Gérez vos événements et participants facilement.</p>
              <p>Veuillez vous <Link to="/login">connecter</Link> ou vous <Link to="/register">inscrire</Link>.</p>
            </div>
          } />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Route d'inscription pour un événement spécifique - NON PROTÉGÉE */}
          <Route
            path="/events/:id/register" // <--- NOUVELLE ROUTE ICI
            element={<RegisterForEventPage />}
          />

          {/* Protection des routes : seules les personnes authentifiées peuvent y accéder */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/create-event"
            element={
              <PrivateRoute>
                <CreateEventPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/events/:id"
            element={
              <PrivateRoute>
                <EventDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/events/:id/edit"
            element={
              <PrivateRoute>
                <EditEventPage />
              </PrivateRoute>
            }
          />
          <Route path="/admin/users" element={<AdminUsersPage />} />

          {/* Ajoutez d'autres routes protégées ici si nécessaire */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;