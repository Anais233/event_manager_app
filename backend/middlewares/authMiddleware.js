// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------- */
/*                     🔹 Vérification de l’authentification 🔹               */
/* -------------------------------------------------------------------------- */
async function protect(req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[AUTH] Aucun token Bearer fourni.');
    return res.status(401).json({ message: 'Accès refusé : aucun token fourni.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.warn('[AUTH] En-tête Authorization invalide.');
    return res.status(401).json({ message: 'Token manquant ou invalide.' });
  }

  try {
    // ✅ Vérifie et décode le token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.userId) {
      return res.status(401).json({ message: 'Token invalide (userId manquant).' });
    }

    // ✅ Recherche de l'utilisateur en base
    const user = await prisma.appUser.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        organizationId: true,
      },
    });

    if (!user) {
      console.warn(`[AUTH] Utilisateur non trouvé pour ID : ${decoded.userId}`);
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    if (!user.isActive) {
      console.warn(`[AUTH] Compte inactif : ${user.email}`);
      return res.status(403).json({ message: 'Votre compte est désactivé.' });
    }

    // ✅ Injection dans la requête
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    next();
  } catch (err) {
    // Gestion des erreurs spécifiques JWT
    if (err.name === 'TokenExpiredError') {
      console.warn('[AUTH] Token expiré.');
      return res.status(401).json({ message: 'Session expirée, veuillez vous reconnecter.' });
    }

    if (err.name === 'JsonWebTokenError') {
      console.warn('[AUTH] Token invalide ou mal formé.');
      return res.status(401).json({ message: 'Token invalide.' });
    }

    console.error('[AUTH] Erreur inattendue :', err);
    return res.status(500).json({ message: 'Erreur interne du serveur (authMiddleware).' });
  }
}

/* -------------------------------------------------------------------------- */
/*                    🔹 Vérification des rôles autorisés 🔹                  */
/* -------------------------------------------------------------------------- */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'Utilisateur non authentifié.' });
    }

    const userRole = req.user.role;

    // ✅ super_admin a accès à tout
    if (userRole === 'super_admin') return next();

    if (!allowedRoles.includes(userRole)) {
      console.warn(`[AUTH] Accès refusé : rôle ${userRole} non autorisé.`);
      return res.status(403).json({
        message: `Accès refusé : votre rôle (${userRole}) n'est pas autorisé.`,
      });
    }

    next();
  };
}

/* -------------------------------------------------------------------------- */
/*              🔹 Vérification d’accès à sa propre organisation 🔹           */
/* -------------------------------------------------------------------------- */
async function authorizeOrganizationAccess(req, res, next) {
  const { user } = req;
  if (!user) return res.status(403).json({ message: 'Utilisateur non authentifié.' });

  // ✅ super_admin → accès global
  if (user.role === 'super_admin') return next();

  const orgIdFromParams = req.params.orgId || req.body.organizationId;
  if (!orgIdFromParams) {
    return res.status(400).json({ message: 'Organisation non spécifiée dans la requête.' });
  }

  if (user.organizationId !== orgIdFromParams) {
    console.warn(`[AUTH] Accès refusé à l’organisation ${orgIdFromParams} pour l’utilisateur ${user.email}`);
    return res.status(403).json({
      message: `Accès refusé : vous ne pouvez gérer que votre organisation (${user.organizationId}).`,
    });
  }

  next();
}

module.exports = {
  protect,
  authorizeRoles,
  authorizeOrganizationAccess,
};
