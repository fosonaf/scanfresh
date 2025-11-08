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

// URL validation and sanitization
const validateAndSanitizeUrls = (urlsInput: string): { valid: boolean; urls: string[]; error: string } => {
    if (!urlsInput || typeof urlsInput !== 'string') {
        return { valid: false, urls: [], error: 'Invalid URLs' };
    }

    const lines = urlsInput.split('\n')
        .map((u: string) => u.trim())
        .filter((u: string) => u.length > 0);

    // Maximum 4 URLs
    if (lines.length > 4) {
        return { valid: false, urls: [], error: 'Maximum 4 URLs allowed' };
    }

    if (lines.length === 0) {
        return { valid: false, urls: [], error: 'No URLs provided' };
    }

    const validUrls: string[] = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check that there are no spaces or additional characters
        if (line.includes(' ') || line !== line.trim()) {
            return { valid: false, urls: [], error: `Line ${i + 1}: only one URL per line` };
        }

        // Validate URL
        try {
            const url = new URL(line);
            // Check that it's HTTP or HTTPS only
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                return { valid: false, urls: [], error: `Line ${i + 1}: only HTTP/HTTPS URLs are allowed` };
            }
            // Add validated URL (use href to normalize)
            validUrls.push(url.href);
        } catch (e) {
            return { valid: false, urls: [], error: `Line ${i + 1}: invalid URL` };
        }
    }

    return { valid: true, urls: validUrls, error: '' };
};

router.post('/compile', async (req, res) => {
    const { urls } = req.body;

    if (!urls) {
        return res.status(400).json({ success: false, error: 'No URLs provided' });
    }

    // Valider et sanitiser les URLs
    const validation = validateAndSanitizeUrls(urls);
    if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
    }

    try {
        const urlsList = validation.urls;

        console.log(`[COMPILE] Processing ${urlsList.length} URLs`);

        const tempDir = os.tmpdir();
        const outputPdfPath = path.join(tempDir, `result_${Date.now()}.pdf`);

        const scriptPath = path.resolve(__dirname, '../scripts/dl_pdf.py');
        console.log(`[COMPILE] Script path: ${scriptPath}`);
        console.log(`[COMPILE] Script exists: ${fs.existsSync(scriptPath)}`);

        const urlsArg = JSON.stringify(urlsList);

        console.log(`[COMPILE] Spawning Python script...`);
        const python = spawn('python', [scriptPath, urlsArg, outputPdfPath]);

        let stderrBuffer = '';
        let stdoutBuffer = '';

        python.stderr.on('data', (data) => {
            const message = data.toString();
            stderrBuffer += message;
            console.error(`[PYTHON STDERR] ${message}`);
        });

        python.stdout.on('data', (data) => {
            const message = data.toString();
            stdoutBuffer += message;
            console.log(`[PYTHON STDOUT] ${message}`);
        });

        python.on('error', (error) => {
            console.error(`[COMPILE] Failed to start Python process:`, error);
            return res.status(500).json({
                success: false,
                error: 'Failed to start Python process',
                details: error.message
            });
        });

        python.on('close', (code) => {
            console.log(`[COMPILE] Python process exited with code ${code}`);

            if (code !== 0) {
                console.error(`[COMPILE] Python script failed`);
                console.error(`[COMPILE] STDERR output:`, stderrBuffer);
                console.error(`[COMPILE] STDOUT output:`, stdoutBuffer);

                return res.status(500).json({
                    success: false,
                    error: 'Python script execution failed',
                    exitCode: code,
                    stderr: stderrBuffer,
                    stdout: stdoutBuffer
                });
            }

            // Vérifier que le PDF existe
            if (!fs.existsSync(outputPdfPath)) {
                console.error(`[COMPILE] PDF file was not created at ${outputPdfPath}`);
                return res.status(500).json({
                    success: false,
                    error: 'PDF file was not created',
                    stderr: stderrBuffer
                });
            }

            const fileSize = fs.statSync(outputPdfPath).size;
            console.log(`[COMPILE] PDF created successfully, size: ${fileSize} bytes`);

            res.download(outputPdfPath, 'result.pdf', (err) => {
                if (err) {
                    console.error('[COMPILE] Error sending PDF:', err);
                    return res.status(500).end();
                }

                console.log('[COMPILE] PDF sent successfully, cleaning up...');
                fs.unlink(outputPdfPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('[COMPILE] Error deleting temp PDF:', unlinkErr);
                    } else {
                        console.log('[COMPILE] Temp PDF deleted');
                    }
                });
            });
        });

    } catch (err) {
        console.error('[COMPILE] Server error:', err);
        res.status(500).json({
            success: false,
            error: 'Server error',
            details: err instanceof Error ? err.message : String(err)
        });
    }
});

router.post('/save', async (req, res) => {
    const { urls, title } = req.body;

    if (!urls) {
        return res.status(400).json({ success: false, error: 'No URLs provided' });
    }

    // Valider et sanitiser les URLs (pour save, on accepte une seule URL à la fois)
    const validation = validateAndSanitizeUrls(urls);
    if (!validation.valid) {
        return res.status(400).json({ success: false, error: validation.error });
    }

    // For save, we only take the first URL
    if (validation.urls.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid URL' });
    }

    // Sanitize title (limit length and remove dangerous characters)
    const sanitizedTitle = typeof title === 'string' 
        ? title.trim().slice(0, 200).replace(/[<>:"/\\|?*]/g, '') 
        : 'Untitled';

    // Immediate response
    res.status(202).json({ success: true, message: 'Save started in background' });

    // Background processing
    (async () => {
        try {
            // Use only the first validated URL
            const urlToProcess = validation.urls[0];
            const urlsList = [urlToProcess];

            console.log(`[SAVE] Processing 1 URL in background`);

            const tempDir = os.tmpdir();
            const outputPdfPath = path.join(tempDir, `result_${Date.now()}.pdf`);
            const scriptPath = path.resolve(__dirname, '../scripts/dl_pdf.py');

            console.log(`[SAVE] Script path: ${scriptPath}`);
            console.log(`[SAVE] Script exists: ${fs.existsSync(scriptPath)}`);

            const urlsArg = JSON.stringify(urlsList);

            console.log(`[SAVE] Spawning Python script...`);
            const python = spawn('python', [scriptPath, urlsArg, outputPdfPath]);

            let stderrBuffer = '';

            python.stderr.on('data', (data) => {
                const message = data.toString();
                stderrBuffer += message;
                console.error(`[SAVE PYTHON STDERR] ${message}`);
            });

            python.stdout.on('data', (data) => {
                console.log(`[SAVE PYTHON STDOUT] ${data.toString()}`);
            });

            python.on('error', (error) => {
                console.error(`[SAVE] Failed to start Python process:`, error);
            });

            python.on('close', async (code) => {
                console.log(`[SAVE] Python process exited with code ${code}`);

                if (code !== 0) {
                    console.error(`[SAVE] Python script failed`);
                    console.error(`[SAVE] STDERR:`, stderrBuffer);
                    return;
                }

                if (!fs.existsSync(outputPdfPath)) {
                    console.error(`[SAVE] PDF file was not created`);
                    return;
                }

                try {
                    const pdfBuffer = fs.readFileSync(outputPdfPath);
                    const fileSize = pdfBuffer.length;
                    console.log(`[SAVE] PDF read successfully, size: ${fileSize} bytes`);

                    await client.connect();
                    console.log('[SAVE] Connected to MongoDB');

                    const db = client.db(dbName);
                    const bucket = new GridFSBucket(db, { bucketName: 'pdfs' });

                    const uploadStream = bucket.openUploadStream(sanitizedTitle || 'Untitled', {
                        metadata: { urls: urlsList, createdAt: new Date() }
                    });

                    uploadStream.end(pdfBuffer);

                    uploadStream.on('error', (err) => {
                        console.error("[SAVE] Error uploading PDF to GridFS:", err);
                    });

                    uploadStream.on('finish', () => {
                        console.log('[SAVE] PDF saved successfully to MongoDB with ID:', uploadStream.id);

                        fs.unlink(outputPdfPath, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error('[SAVE] Error deleting temp PDF:', unlinkErr);
                            } else {
                                console.log('[SAVE] Temp PDF deleted');
                            }
                        });
                    });
                } catch (err) {
                    console.error('[SAVE] Error saving to DB:', err);
                }
            });

        } catch (err) {
            console.error('[SAVE] Background task error:', err);
        }
    })();
});


export default router;