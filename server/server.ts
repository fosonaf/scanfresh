import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import compilator from './routes/compilator';
import downloads from './routes/downloads';

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/compilator', compilator);
app.use('/api/downloads', downloads);

// Setup static file serving for frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend build files
app.use(express.static(path.join(__dirname, 'public')));

app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
