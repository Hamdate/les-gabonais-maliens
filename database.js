const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'cyber_db',
    port: 3308 // Change en 3306 si ça ne marche pas
});

module.exports = pool.promise();