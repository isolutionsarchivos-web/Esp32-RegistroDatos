// ==========================================================
//  Proyecto: API ESP32-RegistroDatos
//  Funcionalidad:
//    - Guarda registros de peso enviados por ESP32 (POST)
//    - Devuelve registros guardados (GET)
//    - Prueba de conexión con MySQL
// ==========================================================

const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(express.json());

// =======================
//  Conexión a MySQL
// =======================
let db;

async function connectDB() {
    try {
        db = await mysql.createPool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
            waitForConnections: true,
            connectionLimit: 10
        });
        console.log("✅ Conectado a la base de datos MySQL");
    } catch (err) {
        console.error("❌ Error conectando a MySQL:", err);
    }
}
connectDB();

// =======================
//  Endpoint raíz
// =======================
app.get('/', (req, res) => {
    res.send('📡 API ESP32-RegistroDatos activa');
});

// =======================
//  Endpoint de prueba DB
// =======================
app.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT NOW() AS fechaActual;');
        res.json({ status: 'ok', fechaActual: rows[0].fechaActual });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// =======================
//  Endpoint para guardar pesos (POST)
//  Espera un array JSON con objetos [{fecha, descripcion, peso}, ...]
// =======================
app.post('/pesos', async (req, res) => {
    const registros = req.body;

    if (!Array.isArray(registros)) {
        return res.status(400).send("El cuerpo debe ser un array de registros");
    }

    try {
        for (let r of registros) {
            await db.query(
                `INSERT INTO ${process.env.DB_TABLE} (fecha, descripcion, peso) VALUES (?, ?, ?);`,
                [r.fecha, r.descripcion, r.peso]
            );
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error("❌ Error al insertar registros:", err);
        res.status(500).send('Error al insertar datos');
    }
});

// =======================
//  Endpoint para obtener pesos guardados (GET)
//  Devuelve los últimos 100 registros de la tabla
// =======================
app.get('/pesos', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, fecha, descripcion, peso FROM ${process.env.DB_TABLE} ORDER BY fecha DESC LIMIT 100;`
        );
        res.json(rows);
    } catch (err) {
        console.error("❌ Error al obtener registros:", err);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

// =======================
//  Servidor Express
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
