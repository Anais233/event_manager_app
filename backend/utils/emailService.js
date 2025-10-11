const sgMail = require('@sendgrid/mail');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const getStream = require('get-stream');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * --- Envoi mail d’inscription en attente ---
 */
async function sendPendingEmail(participant, event) {
  const htmlContent = `
    <h2>Inscription en attente</h2>
    <p>Bonjour ${participant.firstName} ${participant.lastName},</p>
    <p>Nous avons bien reçu votre demande d'inscription à l’événement <b>${event.name}</b>.</p>
    <p>Elle est actuellement <b>en cours d’étude</b> par l’organisateur.</p>
    <p>Vous recevrez un email de confirmation dès que votre inscription sera validée.</p>
    <p>Merci de votre patience.</p>
  `;

  const msg = {
    to: participant.email,
    from: process.env.SENDER_EMAIL,
    subject: `Inscription en attente - ${event.name}`,
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log(`📩 Email d’attente envoyé à ${participant.email}`);
  } catch (error) {
    console.error("Erreur envoi email PENDING:", error);
    throw new Error("Impossible d’envoyer l’email d’attente.");
  }
}

/**
 * --- Envoi mail de validation avec QR code (PDF attaché) ---
 */
async function sendRegistrationEmail(participant, event) {
  try {
    // Générer QR code
    const qrCodeDataUrl = await QRCode.toDataURL(participant.qrCodeData);

    // Générer PDF avec PDFKit
    const doc = new PDFDocument();
    doc.fontSize(20).text("Confirmation d'inscription", { align: 'center' });
    doc.moveDown();

    // Infos participant & event
    doc.fontSize(14).text(`Nom : ${participant.firstName} ${participant.lastName}`);
    doc.text(`Événement : ${event.name}`);
    if (event.startDate) {
      doc.text(
        `Date : ${new Date(event.startDate).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}`
      );
    }
    doc.text(`Lieu : ${event.location || "À confirmer"}`);
    doc.moveDown();

    // QR code image
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(",")[1], "base64");
    doc.image(qrBuffer, { fit: [200, 200], align: 'center' });
    doc.text(`Pays : ${participant.country || "Non précisé"}`, { align: 'center' });

    doc.end();

    // Convertir PDF en buffer via get-stream (fonctionne avec get-stream@5)
    const pdfBuffer = await getStream.buffer(doc);

    // Email avec PDF en pièce jointe
    const msg = {
      to: participant.email,
      from: process.env.SENDER_EMAIL,
      subject: `Confirmation validée - ${event.name}`,
      html: `<p>Bonjour ${participant.firstName},</p>
             <p>Votre inscription à <b>${event.name}</b> est validée.</p>
             <p>Veuillez trouver votre QR Code en pièce jointe (PDF).</p>`,
      attachments: [
        {
          content: pdfBuffer.toString("base64"),
          filename: `ticket-${event.name}.pdf`,
          type: "application/pdf",
          disposition: "attachment"
        }
      ]
    };

    await sgMail.send(msg);
    console.log(`✅ Email VALIDÉ avec PDF envoyé à ${participant.email}`);
  } catch (error) {
    console.error("Erreur envoi email VALIDÉ:", error);
    throw new Error("Impossible d’envoyer l’email validé.");
  }
}

module.exports = { sendPendingEmail, sendRegistrationEmail };
