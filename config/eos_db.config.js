const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: 'EOSDB',
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        trustServerCertificate: true,
    },
};

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to EOSDB');
        return pool;
    })
    .catch(err => {
        console.error('EOSDB connection failed:', err);
        throw err;
    });

module.exports = {
    sql,
    poolPromise,
};
