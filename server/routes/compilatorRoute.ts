import { Router } from 'express'
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

const router = Router()

router.post('/compile', async (req, res) => {
    const { urls } = req.body

    if (!urls) {
        return res.status(400).json({ success: false, error: 'No URLs provided' })
    }

    try {
        // Préparer la liste des URLs
        const urlsList: string[] = urls
            .split('\n')
            .map((u: string) => u.trim())
            .filter(Boolean)

        // Créer un chemin temporaire pour le fichier PDF
        const tempDir = os.tmpdir()
        const outputPdfPath = path.join(tempDir, `result_${Date.now()}.pdf`)

        // Vérification du chemin du script Python
        const scriptPath = path.resolve(__dirname, '../scripts/dl_pdf.py')
        console.log('Python script path:', scriptPath)

        // Formatage correct des arguments pour python
        const urlsArg = JSON.stringify(urlsList) // JSON.stringify pour envoyer un tableau JSON comme argument
        console.log('URLs to pass to Python:', urlsArg)

        // Appel du script Python avec les arguments correctement formatés
        const python = spawn('python', [scriptPath, urlsArg, outputPdfPath])

        // Log des erreurs de stderr
        python.stderr.on('data', (data) => {
            console.error(`stderr: ${data.toString()}`)
        })

        // Log des données de stdout
        python.stdout.on('data', (data) => {
            console.log(`stdout: ${data.toString()}`)
        })

        // Lors de la fermeture du processus Python
        python.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script failed with exit code ${code}`)
                return res.status(500).json({ success: false, error: 'Python script failed' })
            }

            console.log('PDF generated, sending file...')

            // Envoi du fichier PDF généré
            res.download(outputPdfPath, 'result.pdf', (err) => {
                if (err) {
                    console.error('Error sending PDF:', err)
                    return res.status(500).end()
                }

                // Nettoyage après envoi du fichier
                fs.unlink(outputPdfPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting temp PDF:', unlinkErr)
                    }
                })
            })
        })

    } catch (err) {
        console.error('Server error:', err)
        res.status(500).json({ success: false, error: 'Server error' })
    }
})

export default router
