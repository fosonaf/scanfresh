import express from 'express'
import cors from 'cors'
import compilatorRoute from './routes/compilatorRoute'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/compilator', compilatorRoute)

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
})
