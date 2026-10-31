const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./src/config/db');

// Import modular routes
const authRoutes = require('./src/routes/auth.routes');
const petsRoutes = require('./src/routes/pets.routes');
const campaignsRoutes = require('./src/routes/campaigns.routes');
const adoptionsRoutes = require('./src/routes/adoptions.routes');
const usersRoutes = require('./src/routes/users.routes');
const faqsRoutes = require('./src/routes/faqs.routes');
const categoriesRoutes = require('./src/routes/categories.routes');
const statsRoutes = require('./src/routes/stats.routes');
const teamRoutes = require('./src/routes/team.routes');
const newsletterRoutes = require('./src/routes/newsletter.routes');

const app = express();
const port = process.env.PORT || 5000;

// Global Middleware
app.use(cors());
app.use(express.json());

// Initialize Database & Mount Routes
async function startServer() {
    try {
        await connectDB();

        // Mount modular routers
        app.use('/', authRoutes);
        app.use('/', petsRoutes);
        app.use('/', campaignsRoutes);
        app.use('/', adoptionsRoutes);
        app.use('/', usersRoutes);
        app.use('/', faqsRoutes);
        app.use('/', categoriesRoutes);
        app.use('/', statsRoutes);
        app.use('/', teamRoutes);
        app.use('/', newsletterRoutes);

        // Root check
        app.get('/', (req, res) => {
            res.send('PeddyCare Modular Server v2.0 is running smoothly!');
        });

        app.listen(port, () => {
            console.log(`PeddyCare Modular Server listening on port ${port}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

startServer();

module.exports = app;