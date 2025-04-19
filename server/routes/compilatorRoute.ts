import { Router } from 'express'
import { MongoClient } from 'mongodb'

const router = Router()

const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)
const dbName = 'scanfresh'

router.get('/log', async (req, res) => {
    try {
        await client.connect()
        const db = client.db(dbName)
        const collection = db.collection('log')

        const message = `Get urls ${new Date().toISOString()}`
        const result = await collection.insertOne({ message })

        res.json({ success: true, insertedId: result.insertedId })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, error: 'Error inserting document' })
    } finally {
        await client.close()
    }
})

router.post('/compile', async (req, res) => {
    const { urls } = req.body

    if (!urls) {
        return res.status(400).json({ success: false, error: 'No URLs provided' })
    }

    try {
        await client.connect()
        const db = client.db(dbName)
        const collection = db.collection('compilator')

        // Tu peux parser la string en tableau si tu veux :
        const urlsList = urls.split('\n').map(u => u.trim()).filter(Boolean)

        const doc = {
            message: `Received ${urlsList.length} URLs`,
            urls: urlsList,
            createdAt: new Date()
        }

        const result = await collection.insertOne(doc)

        res.json({ success: true, insertedId: result.insertedId })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, error: 'Error inserting document' })
    } finally {
        await client.close()
    }
})

export default router
