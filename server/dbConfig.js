const Pool = require("pg").Pool;

const pool = new Pool({
    user: "postgres",
    password: "joyce123",
    host: "localhost",
    port: 5432,
    database: "ProyectoBDD"
})

module.exports = pool;