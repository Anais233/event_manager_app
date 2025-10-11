// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

// 🔒 Toutes ces routes nécessitent d’être connecté
router.use(protect);

// 📌 Liste des utilisateurs
// super_admin → tous les users
// admin_org → uniquement ceux de son organisation
router.get('/', authorizeRoles('super_admin', 'admin_org'), userController.getUsers);

// 📌 Créer un nouvel utilisateur (par un admin_org)
router.post('/', authorizeRoles('admin_org'), userController.createUserByAdmin);

// 📌 Activer/désactiver un utilisateur
router.patch('/:id/toggle-active', authorizeRoles('admin_org'), userController.toggleActive);

// 📌 Modifier le rôle d’un utilisateur
router.patch('/:id/role', authorizeRoles('super_admin', 'admin_org'), userController.updateUserRole);

// 📌 Supprimer un utilisateur
router.delete('/:id', authorizeRoles('admin_org'), userController.deleteUser);

module.exports = router;
