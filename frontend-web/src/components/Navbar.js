import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

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
            <li className="nav-item"><Link to="/register">S'inscrire</Link></li>
            <li className="nav-item"><Link to="/login">Se connecter</Link></li>
          </>
        ) : (
          <>
            <li className="nav-item"><Link to="/dashboard">Dashboard</Link></li>
            <li className="nav-item">
              <button onClick={handleLogout} className="nav-button">Déconnexion</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;