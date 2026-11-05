const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const { db: firestore, admin } = require("./firebase");
const autenticarUsuario = require("./autenticarUsuario");
const { createApp } = require("./app");

const sqliteDb = new sqlite3.Database(path.join(__dirname, "../teste_helena.db"));
const uploadDirectory = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const app = createApp({
    firestore,
    admin,
    authenticateUser: autenticarUsuario,
    sqliteDb,
    uploadDirectory
});

const PORT = process.env.PORT || 3002;
console.log("Banco utilizado:", path.join(__dirname, "../teste_helena.db"));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
