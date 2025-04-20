const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { spawn } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://fosonaf:passwd001@scanfresh-mongo.3igqvta.mongodb.net/scanfresh');

app.post('/generate-pdf', (req, res) => {
    const { urls } = req.body;

    const process = spawn('python3', ['ton_script.py', ...urls]);

    res.setHeader('Content-Type', 'application/pdf');
    process.stdout.pipe(res);
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
