import { Router } from 'express'
import { MongoClient, ObjectId, GridFSBucket } from 'mongodb'

const router = Router()
const uri = 'mongodb+srv://fosonaf:passwd001@scanfresh-mongo.3igqvta.mongodb.net'
const client = new MongoClient(uri)
const dbName = 'scanfresh'

router.get('/:id', async (req, res) => {
    const { id } = req.params

    try {
        await client.connect()
        const db = client.db(dbName)
        const bucket = new GridFSBucket(db, { bucketName: 'pdfs' })

        const fileId = new ObjectId(id)

        const fileDoc = await db.collection('pdfs.files').findOne({ _id: fileId })
        if (!fileDoc) {
            return res.status(404).json({ success: false, error: 'PDF not found' })
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileDoc.filename}.pdf"`,
        })

        const downloadStream = bucket.openDownloadStream(fileId)
        downloadStream.pipe(res).on('error', (err) => {
            console.error('Stream error:', err)
            res.status(500).end()
        })

    } catch (err) {
        console.error('Error downloading PDF:', err)
        res.status(500).json({ success: false, error: 'Server error' })
    }
})

router.get('/', async (_req, res) => {
    try {
        await client.connect()
        const db = client.db(dbName)

        const files = await db.collection('pdfs.files').find().sort({ uploadDate: -1 }).toArray()

        const result = files.map((file: any) => ({
            _id: file._id.toString(),
            title: file.filename,
            createdAt: file.uploadDate,
            metadata: file.metadata || {},
        }))

        res.json({ success: true, data: result })
    } catch (err) {
        console.error('Error fetching downloads:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch downloads' })
    }
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params

    try {
        await client.connect()
        const db = client.db(dbName)
        const bucket = new GridFSBucket(db, { bucketName: 'pdfs' })

        const fileId = new ObjectId(id)

        await bucket.delete(fileId)

        res.json({ success: true, message: 'PDF deleted successfully' })
    } catch (err: any) {
        if (err.message.includes('FileNotFound')) {
            return res.status(404).json({ success: false, error: 'PDF not found' })
        }

        console.error('Error deleting PDF:', err)
        res.status(500).json({ success: false, error: 'Server error' })
    }
})

export default router
