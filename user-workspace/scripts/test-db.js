const mysql = require('mysql2');
require('dotenv').config();

// Create a connection with basic configuration
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('Attempting to connect with following credentials:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);

// Try to connect
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:');
        console.error('Error code:', err.code);
        console.error('Error number:', err.errno);
        console.error('SQL state:', err.sqlState);
        console.error('Full error:', err);
        process.exit(1);
    }
    
    console.log('Successfully connected to database!');
    
    // Try a simple query
    connection.query('SELECT 1', (err, results) => {
        if (err) {
            console.error('Error executing test query:', err);
        } else {
            console.log('Test query successful:', results);
        }
        
        // Close the connection
        connection.end((err) => {
            if (err) {
                console.error('Error closing connection:', err);
                process.exit(1);
            }
            console.log('Connection closed successfully');
            process.exit(0);
        });
    });
});
