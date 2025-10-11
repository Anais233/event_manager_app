// backend/controllers/eventController.js
const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const { Parser } = require("json2csv");
const {
  sendPendingEmail,
  sendRegistrationEmail,
} = require("../utils/emailService");

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------- */
/*                          🔹 CRÉER UN ÉVÉNEMENT 🔹                          */
/* -------------------------------------------------------------------------- */
async function createEvent(req, res) {
  const {
    name,
    description,
    startDate,
    endDate,
    location,
    imageUrl,
    maxParticipants,
  } = req.body;
  const organizerId = req.user.userId;

  if (!name || !startDate || !organizerId) {
    return res
      .status(400)
      .json({ message: "Name, start date, and organizer ID are required." });
  }

  try {
    const organizer = await prisma.appUser.findUnique({
      where: { id: organizerId },
    });
    if (!organizer || !organizer.organizationId) {
      return res
        .status(403)
        .json({ message: "Impossible de créer un événement sans organisation." });
    }

    const newEvent = await prisma.appEvent.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location,
        imageUrl,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        organizer: { connect: { id: organizerId } },
        organization: { connect: { id: organizer.organizationId } },
      },
    });

    res
      .status(201)
      .json({ message: "Événement créé avec succès !", event: newEvent });
  } catch (error) {
    console.error("❌ Erreur création événement :", error);
    res.status(500).json({ message: "Erreur serveur lors de la création." });
  }
}

/* -------------------------------------------------------------------------- */
/*                         🔹 OBTENIR TOUS LES ÉVÉNEMENTS 🔹                  */
/* -------------------------------------------------------------------------- */
async function getEvents(req, res) {
  const { userId, role } = req.user;
  try {
    let events;

    if (role === "admin_org" || role === "employee_org") {
      const user = await prisma.appUser.findUnique({
        where: { id: userId },
        select: { organizationId: true },
      });

      if (!user.organizationId)
        return res.status(404).json({ message: "Aucune organisation associée." });

      events = await prisma.appEvent.findMany({
        where: { organizationId: user.organizationId },
        orderBy: { startDate: "asc" },
      });
    } else if (role === "protocol") {
      events = await prisma.appEvent.findMany({
        where: { protocolAccess: { some: { userId } } },
        orderBy: { startDate: "asc" },
      });
    } else {
      return res
        .status(403)
        .json({ message: "Rôle non autorisé à voir les événements." });
    }

    res.status(200).json({ events });
  } catch (err) {
    console.error("❌ Erreur récupération événements :", err);
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la récupération des événements." });
  }
}

/* -------------------------------------------------------------------------- */
/*                       🔹 OBTENIR UN ÉVÉNEMENT PAR ID 🔹                    */
/* -------------------------------------------------------------------------- */
async function getEventById(req, res) {
  const { id } = req.params;
  try {
    const event = await prisma.appEvent.findUnique({
      where: { id },
      include: { participants: true, organizer: true },
    });

    if (!event)
      return res.status(404).json({ message: "Événement non trouvé." });

    res.status(200).json({ event });
  } catch (err) {
    console.error("❌ Erreur récupération événement :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/* -------------------------------------------------------------------------- */
/*                         🔹 MISE À JOUR D’UN ÉVÉNEMENT 🔹                   */
/* -------------------------------------------------------------------------- */
async function updateEvent(req, res) {
  const { id } = req.params;
  const {
    name,
    description,
    startDate,
    endDate,
    location,
    imageUrl,
    maxParticipants,
  } = req.body;

  try {
    const event = await prisma.appEvent.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ message: "Événement introuvable." });

    const updated = await prisma.appEvent.update({
      where: { id },
      data: {
        name: name ?? event.name,
        description: description ?? event.description,
        startDate: startDate ? new Date(startDate) : event.startDate,
        endDate: endDate ? new Date(endDate) : event.endDate,
        location: location ?? event.location,
        imageUrl: imageUrl ?? event.imageUrl,
        maxParticipants:
          maxParticipants !== undefined
            ? parseInt(maxParticipants)
            : event.maxParticipants,
      },
    });

    res.status(200).json({ message: "Événement mis à jour.", event: updated });
  } catch (error) {
    console.error("❌ Erreur mise à jour événement :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/* -------------------------------------------------------------------------- */
/*                         🔹 SUPPRIMER UN ÉVÉNEMENT 🔹                       */
/* -------------------------------------------------------------------------- */
async function deleteEvent(req, res) {
  const { id } = req.params;
  try {
    await prisma.appEvent.delete({ where: { id } });
    res.status(200).json({ message: "Événement supprimé avec succès." });
  } catch (error) {
    console.error("❌ Erreur suppression événement :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/* -------------------------------------------------------------------------- */
/*                      🔹 INSCRIRE UN PARTICIPANT 🔹                         */
/* -------------------------------------------------------------------------- */
async function registerParticipant(req, res) {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    city,
    country,
    phone,
    arrivalDate,
    departureDate,
  } = req.body;

  try {
    const event = await prisma.appEvent.findUnique({ where: { id } });
    if (!event)
      return res.status(404).json({ message: "Événement introuvable." });

    const existing = await prisma.participant.findUnique({
      where: { eventId_email: { eventId: id, email } },
    });
    if (existing)
      return res
        .status(400)
        .json({ message: "Cet email est déjà inscrit à cet événement." });

    const participant = await prisma.participant.create({
      data: {
        eventId: id,
        firstName,
        lastName,
        email,
        city,
        country,
        phone,
        arrivalDate: arrivalDate ? new Date(arrivalDate) : null,
        departureDate: departureDate ? new Date(departureDate) : null,
        qrCodeData: uuidv4(),
        status: "PENDING",
      },
    });

    await sendPendingEmail(participant, event);

    res
      .status(201)
      .json({ message: "Inscription en attente de validation.", participant });
  } catch (error) {
    console.error("❌ Erreur inscription :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/* -------------------------------------------------------------------------- */
/*                      🔹 PRÉ-VALIDATION D’UN PARTICIPANT 🔹                */
/* -------------------------------------------------------------------------- */
async function preValidateParticipant(req, res) {
  const { participantId } = req.params;
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant)
      return res.status(404).json({ message: "Participant introuvable." });

    if (participant.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Seuls les participants en attente peuvent être pré-validés." });
    }

    const updated = await prisma.participant.update({
      where: { id: participantId },
      data: { status: "PRE_VALIDATED" },
    });

    res.status(200).json({
      message: "Participant pré-validé avec succès.",
      participant: updated,
    });
  } catch (error) {
    console.error("❌ Erreur pré-validation :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/* -------------------------------------------------------------------------- */
/*                      🔹 VALIDATION D’UN PARTICIPANT 🔹                     */
/* -------------------------------------------------------------------------- */
async function validateParticipant(req, res) {
  const { participantId } = req.params;
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant)
      return res.status(404).json({ message: "Participant introuvable." });

    if (participant.status === "VALIDATED") {
      return res.status(400).json({ message: "Ce participant est déjà validé." });
    }

    const updated = await prisma.participant.update({
      where: { id: participantId },
      data: { status: "VALIDATED" },
    });

    const event = await prisma.appEvent.findUnique({
      where: { id: participant.eventId },
    });

    await sendRegistrationEmail(updated, event);

    res.status(200).json({
      message: "Participant validé et email envoyé.",
      participant: updated,
    });
  } catch (error) {
    console.error("❌ Erreur validation participant :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/* -------------------------------------------------------------------------- */
/*                        🔹 CHECK-IN (QR CODE) 🔹                            */
/* -------------------------------------------------------------------------- */
async function checkInParticipant(req, res) {
  const { qrCodeData } = req.body;
  if (!qrCodeData)
    return res.status(400).json({ message: "QR Code requis pour le check-in." });

  try {
    const participant = await prisma.participant.findUnique({
      where: { qrCodeData },
    });
    if (!participant)
      return res.status(404).json({ message: "Participant introuvable." });

    if (participant.checkedIn) {
      return res
        .status(400)
        .json({ message: "Ce participant a déjà effectué le check-in." });
    }

    const updated = await prisma.participant.update({
      where: { qrCodeData },
      data: { checkedIn: true, checkedInAt: new Date() },
    });

    res
      .status(200)
      .json({ message: "Check-in effectué avec succès.", participant: updated });
  } catch (error) {
    console.error("❌ Erreur check-in :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}

/* -------------------------------------------------------------------------- */
/*                      🔹 EXPORTER PARTICIPANTS EN CSV 🔹                   */
/* -------------------------------------------------------------------------- */
async function exportParticipantsToCsv(req, res) {
  const { id } = req.params;
  try {
    const participants = await prisma.participant.findMany({
      where: { eventId: id },
    });

    if (!participants.length)
      return res.status(404).json({ message: "Aucun participant trouvé." });

    const fields = [
      { label: 'Prénom', value: 'firstName' },
      { label: 'Nom', value: 'lastName' },
      { label: 'Email', value: 'email' },
      { label: 'Ville', value: 'city' },
      { label: 'Pays', value: 'country' },
      { label: 'Téléphone', value: 'phone' },
      { label: "Date d'arrivée", value: row => row.arrivalDate ? new Date(row.arrivalDate).toLocaleDateString('fr-FR') : '' },
      { label: "Date de départ", value: row => row.departureDate ? new Date(row.departureDate).toLocaleDateString('fr-FR') : '' },
      { label: 'QR Code', value: 'qrCodeData' },
      { label: 'Check-in', value: row => row.checkedIn ? 'Oui' : 'Non' },
      { label: 'Heure check-in', value: row => row.checkedInAt ? new Date(row.checkedInAt).toLocaleString('fr-FR') : '' },
      { label: "Date inscription", value: row => row.registeredAt ? new Date(row.registeredAt).toLocaleString('fr-FR') : '' },
      { label: "Statut", value: 'status' }
    ];
    const csv = new Parser({ fields }).parse(participants);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="participants-${id}.csv"`
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error("❌ Erreur export CSV :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
}
/* -------------------------------------------------------------------------- */
/*               🔹 RÉCUPÉRER LES PARTICIPANTS D’UN ÉVÉNEMENT 🔹              */
/* -------------------------------------------------------------------------- */
async function getEventParticipants(req, res) {
  const { id } = req.params;

  try {
    const event = await prisma.appEvent.findUnique({
      where: { id },
      include: { participants: true },
    });

    if (!event) {
      return res.status(404).json({ message: "Événement introuvable." });
    }

    res.status(200).json({ participants: event.participants });
  } catch (error) {
    console.error("❌ Erreur récupération participants :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération." });
  }
}
/* -------------------------------------------------------------------------- */
/*                     🔹 ENVOI DES INVITATIONS PAR EMAIL 🔹                  */
/* -------------------------------------------------------------------------- */
async function sendEventInvitations(req, res) {
  const { id: eventId } = req.params;
  const { recipientEmails, message } = req.body;
  const organizerId = req.user.userId;

  if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ message: "Une liste d'emails valide est requise." });
  }

  try {
    const event = await prisma.appEvent.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, organizerId: true },
    });

    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    if (event.organizerId !== organizerId) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à envoyer des invitations pour cet événement." });
    }

    const registrationLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/events/${event.id}/register`;

    for (const email of recipientEmails) {
      console.log(`📨 Invitation envoyée à ${email}: ${registrationLink}`);
    }

    res.status(200).json({ message: `${recipientEmails.length} invitations traitées.` });
  } catch (error) {
    console.error("❌ Erreur envoi invitations :", error);
    res.status(500).json({ message: "Erreur lors de l'envoi des invitations." });
  }
}



module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  registerParticipant,
  preValidateParticipant,
  validateParticipant,
  getEventParticipants,
  checkInParticipant,
  exportParticipantsToCsv,
  sendEventInvitations,

};
