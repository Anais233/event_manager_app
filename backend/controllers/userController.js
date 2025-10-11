// backend/controllers/userController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); 

/**
 * 📌 Liste des utilisateurs
 * super_admin → tous les utilisateurs
 * admin_org → uniquement ceux de sa propre organisation
 */
async function getUsers(req, res) {
  const { role, userId } = req.user;

  try {
    let users;

    if (role === 'super_admin') {
      users = await prisma.appUser.findMany({
        include: { organization: true },
      });
    } else if (role === 'admin_org') {
      const admin = await prisma.appUser.findUnique({ where: { id: userId } });
      if (!admin.organizationId) {
        return res.status(403).json({ message: "Vous n'avez pas d'organisation associée." });
      }

      users = await prisma.appUser.findMany({
        where: { organizationId: admin.organizationId },
        include: { organization: true },
      });
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error("❌ Erreur getUsers:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/**
 * 📌 Activer ou désactiver un utilisateur
 */
async function toggleActive(req, res) {
  const { id } = req.params;

  try {
    const user = await prisma.appUser.findUnique({ where: { id } });

    if (!user || user.organizationId !== req.user.organizationId) {
      return res.status(404).json({ message: 'Utilisateur introuvable ou non autorisé.' });
    }

    const updatedUser = await prisma.appUser.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });

    res.json({
      message: `Utilisateur ${updatedUser.isActive ? 'activé' : 'désactivé'} avec succès.`,
      user: updatedUser,
    });
  } catch (err) {
    console.error('❌ Error toggling user:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
  }
}

/**
 * 📌 Création d’un utilisateur par un admin_org
 */
async function createUserByAdmin(req, res) {
  const { email, password, firstName, lastName, role } = req.body;

  const allowedRoles = ['employee_org', 'protocol']; // ⚠️ pas possible de créer un autre admin

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Rôle invalide. Un admin peut créer uniquement employee_org ou protocol.' });
  }

  try {
    const existingUser = await prisma.appUser.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Un utilisateur avec cet email existe déjà.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.appUser.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        isActive: true,
        organizationId: req.user.organizationId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    res.status(201).json({
      message: 'Utilisateur créé avec succès par l’admin.',
      user: newUser,
    });
  } catch (err) {
    console.error('❌ Error creating user by admin:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la création.' });
  }
}

/**
 * 📌 Mise à jour du rôle d’un utilisateur
 */
async function updateUserRole(req, res) {
  const { id } = req.params;
  const { newRole } = req.body;
  const { role, userId } = req.user;

  if (!newRole) return res.status(400).json({ message: "Nouveau rôle requis." });

  try {
    const targetUser = await prisma.appUser.findUnique({ where: { id } });
    if (!targetUser) return res.status(404).json({ message: "Utilisateur introuvable." });

    if (role === 'admin_org') {
      const admin = await prisma.appUser.findUnique({ where: { id: userId } });
      if (!admin.organizationId || admin.organizationId !== targetUser.organizationId) {
        return res.status(403).json({ message: "Pas autorisé à modifier cet utilisateur." });
      }
    }

    const updatedUser = await prisma.appUser.update({
      where: { id },
      data: { role: newRole },
    });

    res.status(200).json({ message: "Rôle mis à jour avec succès", user: updatedUser });
  } catch (error) {
    console.error("❌ Erreur updateUserRole:", error);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour du rôle." });
  }
}

/**
 * 📌 Supprimer un utilisateur
 */
async function deleteUser(req, res) {
  const { id } = req.params;

  try {
    const user = await prisma.appUser.findUnique({ where: { id } });

    if (!user || user.organizationId !== req.user.organizationId) {
      return res.status(404).json({ message: 'Utilisateur introuvable ou non autorisé.' });
    }

    await prisma.appUser.delete({ where: { id } });

    res.json({ message: 'Utilisateur supprimé avec succès.' });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression.' });
  }
}

module.exports = {
  getUsers,
  toggleActive,
  createUserByAdmin,
  updateUserRole,
  deleteUser,
};
