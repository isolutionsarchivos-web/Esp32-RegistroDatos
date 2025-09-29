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
//  Endpoint de prueba
// =======================
app.get('/', (req, res) => {
    res.send('📡 API ESP32-RegistroDatos activa');
});

// =======================
//  Endpoint para guardar pesos
// =======================
app.post('/pesos', async(req, res) => {
    const registros = req.body; // espera un array [{fecha, hora, peso}, ...]

    if (!Array.isArray(registros)) {
        return res.status(400).send("El cuerpo debe ser un array de registros");
    }

    try {
        for (let r of registros) {
            await db.query(
                `INSERT INTO ${process.env.DB_TABLE} (fecha, hora, peso) VALUES (?, ?, ?)`, [r.fecha, r.hora, r.peso]
            );
        }
        res.status(200).send('OK');
    } catch (err) {
        console.error("❌ Error al insertar registros:", err);
        res.status(500).send('Error al insertar datos');
    }
});

// =======================
//  Servidor
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});