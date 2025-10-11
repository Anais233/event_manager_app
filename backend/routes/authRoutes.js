// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.post('/register', authController.register);
router.post('/login', authController.login);
//router.post('/:id/validate', protect, authorizeRoles('super_admin', 'admin_org'), eventController.validateEvent);

// Récupération du user connecté
router.get('/me', protect, async (req, res) => {
  try {
    const user = await prisma.appUser.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (error) {
    console.error('Erreur /auth/me:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
