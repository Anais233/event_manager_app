// backend/controllers/authController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Clé secrète pour les tokens JWT (récupérée des variables d'environnement)
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error('JWT_SECRET not defined in .env file!');
    process.exit(1);
}

// --- Fonction d'Inscription (Register) ---
async function register(req, res) {
    const { email, password, firstName, lastName, role, organizationName } = req.body;

    try {
        // 1. Vérifier si l'utilisateur existe déjà
        const existingUser = await prisma.appUser.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 2. Hacher le mot de passe
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let organization = null;

        // 3. Si l'utilisateur est admin_org, créer une organisation associée
        if (role === 'admin_org' && organizationName) {
            organization = await prisma.appOrganization.upsert({
                where: { name: organizationName },
                update: {}, // ne change rien si elle existe
                create: { name: organizationName },
            });
        }

        // 4. Créer l'utilisateur (⚠️ snake_case pour coller au schema.prisma)
        const newUser = await prisma.appUser.create({
            data: {
                email,
                password_hash: passwordHash,  // ✅
                first_name: firstName,        // ✅
                last_name: lastName,          // ✅
                role: role || 'employee_org',
                isActive: true,
                organizationId: organization ? organization.id : null
            }
        });

        // 5. Générer un token JWT
        const token = jwt.sign(
            { userId: newUser.id, role: newUser.role, organizationId: newUser.organizationId },
            jwtSecret,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name, // ⚠️ adapter camelCase côté réponse API
                lastName: newUser.last_name,
                role: newUser.role,
                organizationId: newUser.organizationId,
                isActive: newUser.isActive
            }
        });

    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error during registration.' });
    }
}

// --- Fonction de Connexion (Login) ---
async function login(req, res) {
    const { email, password } = req.body;

    try {
        // 1. Trouver l'utilisateur
        const user = await prisma.appUser.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 2. Vérifier si le compte est actif
        if (!user.isActive) {
            return res.status(403).json({ message: 'Votre compte est désactivé. Contactez un administrateur.' });
        }

        // 3. Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash); // ✅
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // 4. Générer un token JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role, organizationId: user.organizationId },
            jwtSecret,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Logged in successfully!',
            token,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name, // ⚠️ exposer en camelCase à l’API
                lastName: user.last_name,
                role: user.role,
                organizationId: user.organizationId,
                isActive: user.isActive
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error during login.' });
    }
}


module.exports = {
    register,
    login
};
