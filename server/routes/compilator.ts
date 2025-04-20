import { Router } from 'express';
import { spawn } from 'child_process';
import { MongoClient, GridFSBucket } from 'mongodb';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();
const uri = 'mongodb+srv://fosonaf:passwd001@scanfresh-mongo.3igqvta.mongodb.net';
const client = new MongoClient(uri);
const dbName = 'scanfresh';

router.post('/compile', async (req, res) => {
    const { urls } = req.body;

    if (!urls) {
        return res.status(400).json({ success: false, error: 'No URLs provided' });
    }

    try {
        const urlsList: string[] = urls
            .split('\n')
            .map((u: string) => u.trim())
            .filter(Boolean);

        const tempDir = os.tmpdir();
        const outputPdfPath = path.join(tempDir, `result_${Date.now()}.pdf`);

        const scriptPath = path.resolve(__dirname, '../scripts/dl_pdf.py');

        const urlsArg = JSON.stringify(urlsList);

        const python = spawn('python', [scriptPath, urlsArg, outputPdfPath]);

        python.stderr.on('data', (data) => {
            console.error(`stderr: ${data.toString()}`);
        });

        python.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script failed with exit code ${code}`);
                return res.status(500).json({ success: false, error: 'Python script failed' });
            }

            res.download(outputPdfPath, 'result.pdf', (err) => {
                if (err) {
                    console.error('Error sending PDF:', err);
                    return res.status(500).end();
                }

                fs.unlink(outputPdfPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting temp PDF:', unlinkErr);
                    }
                });
            });
        });

    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

router.post('/save', async (req, res) => {
    const { urls, title } = req.body;

    if (!urls) {
        return res.status(400).json({ success: false, error: 'No URLs provided' });
    }

    try {
        const urlsList: string[] = urls
            .split('\n')
            .map((u: string) => u.trim())
            .filter(Boolean);

        const tempDir = os.tmpdir();
        const outputPdfPath = path.join(tempDir, `result_${Date.now()}.pdf`);

        const scriptPath = path.resolve(__dirname, '../scripts/dl_pdf.py');
        const urlsArg = JSON.stringify(urlsList);

        const python = spawn('python', [scriptPath, urlsArg, outputPdfPath]);

        python.stderr.on('data', (data) => {
            console.error(`stderr: ${data.toString()}`);
        });

        python.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Python script failed with exit code ${code}`);
                return res.status(500).json({ success: false, error: 'Python script failed' });
            }

            try {
                const pdfBuffer = fs.readFileSync(outputPdfPath);

                await client.connect();
                const db = client.db(dbName);
                const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });

                const uploadStream = bucket.openUploadStream(title?.trim() || 'Untitled', {
                    metadata: { urls: urlsList, createdAt: new Date() }
                });

                uploadStream.end(pdfBuffer);

                uploadStream.on('error', (err) => {
                    console.error("Error uploading PDF to GridFS:", err);
                    return res.status(500).json({ success: false, error: 'Failed to upload PDF to GridFS' });
                });

                uploadStream.on('finish', () => {
                    const fileId = uploadStream.id;

                    fs.unlink(outputPdfPath, (unlinkErr) => {
                        if (unlinkErr) console.error('Error deleting temp PDF:', unlinkErr);
                    });

                    return res.status(200).json({ success: true, fileId });
                });
            } catch (err) {
                console.error('Error saving to DB:', err);
                return res.status(500).json({ success: false, error: 'Failed to save PDF' });
            }
        });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

export default router;
