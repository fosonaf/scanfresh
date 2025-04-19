import express from 'express'
import cors from 'cors'
import compilator from './routes/compilator'
import downloads from './routes/downloads'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/compilator', compilator)
app.use('/api/downloads', downloads)

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
})
