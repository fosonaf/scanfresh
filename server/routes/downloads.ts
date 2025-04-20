import { Router } from 'express'
import { MongoClient, ObjectId } from "mongodb";

const router = Router()
const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)
const dbName = 'scanfresh'

router.get('/:id', async (req, res) => {
    const { id } = req.params

    try {
        await client.connect()
        const db = client.db(dbName)
        const collection = db.collection('downloaded_scan')

        const doc = await collection.findOne({ _id: new ObjectId(id) })

        if (!doc || !doc.file) {
            return res.status(404).json({ success: false, error: 'PDF not found' })
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=${id}.pdf`,
        })

        res.send(Buffer.from(doc.file.buffer))
    } catch (err) {
        console.error('Error fetching PDF:', err)
        res.status(500).json({ success: false, error: 'Server error' })
    }
})

router.get('/', async (req, res) => {
    try {
        const db = client.db(dbName)
        const downloads = await db.collection('downloaded_scan').find().toArray()

        const result = downloads.map((pdf: any) => ({
            _id: pdf._id.toString(),
            title: pdf.title || '',
            createdAt: pdf.createdAt,
        }))

        res.json({ success: true, data: result })
    } catch (err) {
        console.error('Error fetching downloads:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch downloads' })
    }
})

router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('downloaded_scan');

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: 'PDF not found' });
        }

        res.json({ success: true, message: 'PDF deleted successfully' });
    } catch (err) {
        console.error('Error deleting PDF:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});


export default router
