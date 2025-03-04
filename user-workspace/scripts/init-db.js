const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initializeDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true // Enable multiple statements for schema execution
    });

    try {
        console.log('Reading schema file...');
        const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');

        console.log('Executing schema...');
        await connection.query(schema);
        console.log('Database tables created successfully!');

    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await connection.end();
    }
}

initializeDatabase();
