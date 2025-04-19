const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// Connexion Mongo
mongoose.connect('mongodb://localhost:27017/scanfresh');

// Exemple de route PDF
app.post('/generate-pdf', (req, res) => {
    const { urls } = req.body;

    const process = spawn('python3', ['ton_script.py', ...urls]);

    res.setHeader('Content-Type', 'application/pdf');
    process.stdout.pipe(res);
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
