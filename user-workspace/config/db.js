const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false,
        enableTrace: true
    },
    connectTimeout: 30000,
    debug: true
});

// Test the connection with detailed error reporting
async function testConnection() {
    try {
        console.log('Attempting to connect to database with following config:');
        console.log('Host:', process.env.DB_HOST);
        console.log('User:', process.env.DB_USER);
        console.log('Database:', process.env.DB_NAME);
        
        const connection = await pool.getConnection();
        console.log('Database connection successful!');
        
        // Test a simple query
        const [rows] = await connection.query('SELECT 1');
        console.log('Test query successful:', rows);
        
        connection.release();
    } catch (error) {
        console.error('Detailed connection error:');
        console.error('Error code:', error.code);
        console.error('Error number:', error.errno);
        console.error('SQL state:', error.sqlState);
        console.error('Full error:', error);
        process.exit(1);
    }
}

// Export both pool and test function
module.exports = {
    pool,
    testConnection
};
