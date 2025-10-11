// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

/* -------------------------------------------------------------------------- */
/*                         🔹 Routes de gestion des événements 🔹             */
/* -------------------------------------------------------------------------- */

// 🔸 Créer un nouvel événement (admin_org uniquement)
router.post('/', protect, authorizeRoles('admin_org'), eventController.createEvent);

// 🔸 Obtenir tous les événements (authentifié)
router.get('/', protect, eventController.getEvents);

// 🔸 Obtenir les détails d’un événement (authentifié)
router.get('/:id', protect, eventController.getEventById);

// 🔸 Mettre à jour un événement (admin_org uniquement)
router.put('/:id', protect, authorizeRoles('admin_org'), eventController.updateEvent);

// 🔸 Supprimer un événement (admin_org uniquement)
router.delete('/:id', protect, authorizeRoles('admin_org'), eventController.deleteEvent);

/* -------------------------------------------------------------------------- */
/*                          🔹 Participants & check-in 🔹                     */
/* -------------------------------------------------------------------------- */

// 🔸 Inscrire un participant à un événement (publique)
router.post('/:id/register', eventController.registerParticipant);

// 🔸 Liste des participants (admin_org et employee_org)
router.get(
  '/:id/participants',
  protect,
  authorizeRoles('admin_org', 'employee_org'),
  eventController.getEventParticipants
);

// 🔸 Validation d’un participant (admin_org / employee_org)
router.post(
  '/:eventId/participants/:participantId/validate',
  protect,
  authorizeRoles('admin_org', 'employee_org'),
  eventController.validateParticipant
);

// 🔸 Check-in d’un participant par QR code (admin_org / employee_org)
router.post(
  '/:id/checkin',
  protect,
  authorizeRoles('admin_org', 'employee_org'),
  eventController.checkInParticipant
);

/* -------------------------------------------------------------------------- */
/*                              🔹 Autres actions 🔹                          */
/* -------------------------------------------------------------------------- */

// 🔸 Envoi des invitations par email (admin_org uniquement)
router.post(
  '/:id/send-invites',
  protect,
  authorizeRoles('admin_org'),
  eventController.sendEventInvitations
);

// 🔸 Export des participants au format CSV
router.get(
  '/:id/participants/export',
  protect,
  authorizeRoles('admin_org', 'employee_org'),
  eventController.exportParticipantsToCsv
);

module.exports = router;
