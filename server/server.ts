import express from 'express'
import cors from 'cors'
import testRoute from './routes/testRoute'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/test', testRoute)

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
})
