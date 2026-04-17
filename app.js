const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 3000;

// Connexion Aiven
const db = mysql.createConnection({
  host: 'mysql-2b734956-sostech.g.aivencloud.com',
  port: 14503,
  user: 'avnadmin',
  password: 'AVNS_AHHsGXHqi0BczY2Iv5t',
  database: 'defaultdb',
  ssl: { rejectUnauthorized: false }
});

db.connect((err) => {
  if (err) return console.error('Erreur Aiven:', err);
  console.log('Connecté à Aiven !');
  db.query(`CREATE TABLE IF NOT EXISTS comptes (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL)`);
  db.query(`CREATE TABLE IF NOT EXISTS utilisateurs (id INT AUTO_INCREMENT PRIMARY KEY, nom VARCHAR(255), prenom VARCHAR(255), email VARCHAR(255), telephone VARCHAR(20), nationalite VARCHAR(100), date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- LIGNE CRUCIALE POUR LE DESIGN ---
app.use(express.static(path.join(__dirname, 'public'))); 

app.use(bodyParser.urlencoded({ extended: false }));

// Routes
app.get('/', (req, res) => { res.render('login'); });
app.get('/register', (req, res) => { res.render('register'); });

app.post('/register', (req, res) => {
    const { email, password } = req.body;
    db.query('INSERT INTO comptes (email, password) VALUES (?, ?)', [email, password], (err) => {
        if (err) return res.send("Erreur : Email déjà utilisé.");
        res.send("<h1>Compte créé !</h1><a href='/'>Se connecter</a>");
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM comptes WHERE email = ? AND password = ?', [email, password], (err, results) => {
        if (results && results.length > 0) { res.redirect('/formulaire'); } 
        else { res.send("Erreur de connexion."); }
    });
});

app.get('/formulaire', (req, res) => { res.render('formulaire'); });

// Action Formulaire (Correction Erreur 500)
app.post('/submit-docs', (req, res) => {
    const { nom, prenom, email, telephone, nationalite } = req.body;
    const query = 'INSERT INTO utilisateurs (nom, prenom, email, telephone, nationalite) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [nom, prenom, email, telephone, nationalite], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erreur interne du serveur lors de l'enregistrement.");
        }
        res.send("<h1>Succès !</h1><p>Données enregistrées.</p><a href='/formulaire'>Retour</a>");
    });
});

app.get('/admin', (req, res) => {
    db.query('SELECT * FROM utilisateurs ORDER BY date_inscription DESC', (err, results) => {
        if (err) return res.send("Erreur.");
        let html = "<h1>Inscrits</h1><table border='1'><tr><th>Nom</th><th>Email</th></tr>";
        results.forEach(u => { html += `<tr><td>${u.nom}</td><td>${u.email}</td></tr>`; });
        res.send(html + "</table>");
    });
});

app.listen(PORT, () => console.log(`Serveur prêt sur port ${PORT}`));
