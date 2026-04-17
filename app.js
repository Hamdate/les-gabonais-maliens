const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion à la base Aiven
const db = mysql.createConnection({
  host: 'mysql-2b734956-sostech.g.aivencloud.com',
  port: 14503,
  user: 'avnadmin',
  password: 'AVNS_AHHsGXHqi0BczY2Iv5t',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
});

// --- ÉTAPE CRUCIALE : CRÉATION AUTOMATIQUE DES TABLES ---
db.connect((err) => {
  if (err) return console.error('Erreur connexion Aiven:', err);
  console.log('Connecté à Aiven !');

  // Création de la table pour les comptes (Connexion/Inscription)
  const sqlComptes = `
    CREATE TABLE IF NOT EXISTS comptes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
    );`;

  // Création de la table pour les données du formulaire
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

  db.query(sqlComptes, (err) => { if (err) console.log('Erreur table comptes'); });
  db.query(sqlUtilisateurs, (err) => { if (err) console.log('Erreur table utilisateurs'); });
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// --- SYSTÈME DE CONNEXION ---

// Page de login par défaut
app.get('/', (req, res) => { res.render('login'); });

// Page d'inscription
app.get('/register', (req, res) => { res.render('register'); });

// Action : Créer un compte
app.post('/auth/register', (req, res) => {
    const { email, password } = req.body;
    db.query('INSERT INTO comptes (email, password) VALUES (?, ?)', [email, password], (err) => {
        if (err) return res.send("Email déjà utilisé.");
        res.redirect('/'); 
    });
});

// Action : Se connecter
app.post('/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM comptes WHERE email = ? AND password = ?', [email, password], (err, results) => {
        if (results.length > 0) {
            res.redirect('/formulaire'); 
        } else {
            res.send("Email ou mot de passe incorrect.");
        }
    });
});

// --- LE FORMULAIRE ---

app.get('/formulaire', (req, res) => { res.render('formulaire'); });

app.post('/submit-docs', (req, res) => {
    const { nom, prenom, email, telephone, nationalite } = req.body;
    const query = 'INSERT INTO utilisateurs (nom, prenom, email, telephone, nationalite) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nom, prenom, email, telephone, nationalite], (err) => {
        if (err) return res.send("Erreur lors de l'envoi.");
        res.send("<h1>Succès !</h1><p>Données enregistrées.</p><a href='/formulaire'>Retour</a>");
    });
});

app.listen(PORT, () => console.log(`Serveur prêt sur port ${PORT}`));