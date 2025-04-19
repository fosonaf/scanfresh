import { useState } from 'react'
import { Circles } from 'react-loader-spinner'
import '../styles/compilator.css'

function Compilator() {
    const [urls, setUrls] = useState('')
    const [loading, setLoading] = useState(false)

    const downLoadCompiledPdf = async () => {
        setLoading(true)
        try {
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
            } else {
                console.error('Failed to fetch the PDF')
            }
        } catch (error) {
            console.error('Error during fetch:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="compilator-container">
            <h1 className="compilator-title">Download</h1>
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

            {loading && (
                <div className="overlay">
                    <div className="loader">
                        <Circles
                            height="50"
                            width="50"
                            color="white"
                            ariaLabel="loading"
                            wrapperClass="loading-wrapper"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Compilator
