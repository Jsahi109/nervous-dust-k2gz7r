const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const { pool, testConnection } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine and layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Import routes
const dashboardRoutes = require('./routes/dashboard');
const uploadRoutes = require('./routes/upload');
const downloadRoutes = require('./routes/download');
const campaignRoutes = require('./routes/campaigns');
const dispositionRoutes = require('./routes/dispositions');

// Test database connection before starting server
async function startServer() {
    try {
        // Test database connection
        await testConnection();

        // Register routes
        app.use('/', dashboardRoutes);
        app.use('/upload', uploadRoutes);
        app.use('/download', downloadRoutes);
        app.use('/campaigns', campaignRoutes);
        app.use('/dispositions', dispositionRoutes);

        // Create uploads directory if it doesn't exist
        const fs = require('fs');
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }

        // Error handling middleware
        app.use((req, res, next) => {
            res.status(404).render('error', {
                title: 'Page Not Found',
                message: 'The page you are looking for does not exist.',
                error: process.env.NODE_ENV === 'development' ? { stack: 'Route not found' } : null
            });
        });

        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(err.status || 500).render('error', {
                title: 'Error',
                message: err.message || 'Something broke!',
                error: process.env.NODE_ENV === 'development' ? err : null
            });
        });

        // Start server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
