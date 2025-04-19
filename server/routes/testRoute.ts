import { Router } from 'express'
import { MongoClient } from 'mongodb'

const router = Router()

// à adapter avec ton URI Mongo locale (ou Atlas si tu veux plus tard)
const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)
const dbName = 'scanfresh'

router.get('/', async (req, res) => {
    try {
        await client.connect()
        const db = client.db(dbName)
        const collection = db.collection('tester')

        const message = `Hello ${new Date().toISOString()}`
        const result = await collection.insertOne({ message })

        res.json({ success: true, insertedId: result.insertedId })
    } catch (err) {
        console.error(err)
        res.status(500).json({ success: false, error: 'Error inserting document' })
    } finally {
        await client.close()
    }
})

export default router
