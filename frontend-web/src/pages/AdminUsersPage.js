import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import "./AdminUsersPage.css";

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // ⚡ Rôles autorisés
  const roles = ["super_admin", "admin_org", "employee_org", "protocol"];

  // Charger la liste des utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/users"); // ✅ correction
        setUsers(res.data.users);
      } catch (err) {
        setError(err.response?.data?.message || "Erreur de chargement des utilisateurs.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Mise à jour du rôle
  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Voulez-vous vraiment changer le rôle de cet utilisateur en ${newRole} ?`)) return;
    try {
      setUpdatingUserId(userId);
      await axiosInstance.patch(`/users/${userId}/role`, { newRole }); // ✅ correction
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la mise à jour du rôle.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) return <p className="loading-message">Chargement des utilisateurs...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="admin-users-page">
      <h2>Gestion des utilisateurs</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Organisation</th>
            <th>Rôle</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.organization ? user.organization.name : "—"}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  disabled={updatingUserId === user.id}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminUsersPage;
