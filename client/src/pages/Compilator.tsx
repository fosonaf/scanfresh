import { useState } from 'react'
import '../styles/compilator.css'

function Compilator() {
    const [urls, setUrls] = useState('')

    const sendLogs = async () => {
        const res = await fetch('http://localhost:3001/api/compilator/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls }),
        })

        const data = await res.json()
        console.log('Response:', data)
    }

    return (
        <div className="compilator-container">
            <h1 className="compilator-title">Compilator</h1>
            <textarea
                className="compilator-textarea"
                placeholder="Paste your list of URLs here..."
                rows={10}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
            />
            <button className="compilator-button" onClick={sendLogs}>
                Submit
            </button>
        </div>
    )
}

export default Compilator
