const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Connexion à la base de données Aiven
const db = mysql.createConnection({
  host: 'mysql-2b734956-sostech.g.aivencloud.com',
  port: 14503,
  user: 'avnadmin',
  password: 'AVNS_AHHsGXHqi0BczY2Iv5t',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
});

// 2. Création automatique des tables au démarrage
db.connect((err) => {
  if (err) return console.error('Erreur connexion Aiven:', err);
  console.log('Connecté à Aiven avec succès !');

  const sqlComptes = `
    CREATE TABLE IF NOT EXISTS comptes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
    );`;

  const sqlUtilisateurs = `
    CREATE TABLE IF NOT EXISTS utilisateurs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(255),
        prenom VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        telephone VARCHAR(20),
        nationalite VARCHAR(100),
        date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

  db.query(sqlComptes);
  db.query(sqlUtilisateurs);
});

// 3. Configuration de l'application
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// --- ROUTES AUTHENTIFICATION ---

// Page de connexion (Accueil)
app.get('/', (req, res) => {
    res.render('login'); 
});

// Page de création de compte
app.get('/register', (req, res) => {
    res.render('register'); 
});

// Action : Créer un compte
app.post('/auth/register', (req, res) => {
    const { email, password } = req.body;
    const query = 'INSERT INTO comptes (email, password) VALUES (?, ?)';
    db.query(query, [email, password], (err) => {
        if (err) return res.send("Erreur : Cet email est déjà utilisé.");
        res.redirect('/'); 
    });
});

// Action : Se connecter
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM comptes WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (results && results.length > 0) {
            res.redirect('/formulaire'); 
        } else {
            res.send("Email ou mot de passe incorrect.");
        }
    });
});

// --- ROUTES FORMULAIRE ---

// Page du formulaire (accessible après login)
app.get('/formulaire', (req, res) => {
    res.render('formulaire');
});

// Action : Enregistrer les données du formulaire
app.post('/submit-docs', (req, res) => {
    const { nom, prenom, email, telephone, nationalite } = req.body;
    const query = 'INSERT INTO utilisateurs (nom, prenom, email, telephone, nationalite) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nom, prenom, email, telephone, nationalite], (err) => {
        if (err) return res.status(500).send("Erreur lors de l'enregistrement.");
        res.send("<h1>Succès !</h1><p>Vos informations ont été enregistrées.</p><a href='/formulaire'>Retour</a>");
    });
});

// --- ROUTE ADMIN (Celle qui manquait) ---

// Page pour voir tous les inscrits
app.get('/admin', (req, res) => {
    const query = 'SELECT * FROM utilisateurs ORDER BY date_inscription DESC';
    db.query(query, (err, results) => {
        if (err) return res.send("Erreur lors de la récupération des données.");
        
        let html = `
        <html>
        <head><title>Admin - Liste</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="font-family: sans-serif; padding: 20px;">
            <h2>Liste des inscrits</h2>
            <table border="1" style="width:100%; border-collapse: collapse;">
                <tr style="background: #eee;">
                    <th>Nom</th><th>Prénom</th><th>Email</th><th>Téléphone</th>
                </tr>`;
        
        results.forEach(user => {
            html += `<tr>
                <td style="padding:8px;">${user.nom}</td>
                <td style="padding:8px;">${user.prenom}</td>
                <td style="padding:8px;">${user.email}</td>
                <td style="padding:8px;">${user.telephone}</td>
            </tr>`;
        });
        
        html += `</table><br><a href="/formulaire">Retour au formulaire</a></body></html>`;
        res.send(html);
    });
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
