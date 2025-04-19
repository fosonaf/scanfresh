import { useState } from 'react'
import '../styles/compilator.css'

function Compilator() {
    const [urls, setUrls] = useState('')

    const downLoadCompiledPdf = async () => {
        const res = await fetch('http://localhost:3001/api/compilator/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls }),
        })

        if (res.ok) {
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'result.pdf'
            a.click()
            window.URL.revokeObjectURL(url)
        }
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
            <button className="compilator-button" onClick={downLoadCompiledPdf}>
                Submit
            </button>
        </div>
    )
}

export default Compilator
