// backend/index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors({
  origin: "*",  // pour le dev, accepte toutes les origines
  credentials: true,
}));

// --- Routes d'API ---
app.get('/api/status', (req, res) => {
  res.status(200).json({ message: 'API is running successfully!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes); // ✅ branché

// --- Gestion 404 ---
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// --- Gestion erreurs globales ---
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log('Connected to the database successfully!');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Access it at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect:', error);
    process.exit(1);
  }
}


main();

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Disconnected from Prisma client.');
  // --- Vérification du chargement du .env ---
console.log("🧩 Vérif .env variables :");
console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY ? "✅ chargée" : "❌ manquante");
console.log("SENDER_EMAIL:", process.env.SENDER_EMAIL || "❌ manquant");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ chargée" : "❌ manquante");
console.log("---------------------------------------------");
  process.exit(0);
});
