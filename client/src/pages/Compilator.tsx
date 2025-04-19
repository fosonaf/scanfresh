import { useState } from 'react'
import { Circles } from 'react-loader-spinner'
import '../styles/compilator.css'

function Compilator() {
    const [urls, setUrls] = useState('')
    const [loading, setLoading] = useState(false)

    const postAndHandle = async (
        endpoint: string,
        onSuccess: (res: Response) => Promise<void>
    ) => {
        setLoading(true)
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ urls }),
            })

            if (res.ok) {
                await onSuccess(res)
            } else {
                const json = await res.json()
                console.error('Error from API:', json.error)
                alert('Operation failed')
            }
        } catch (error) {
            console.error('Network or server error:', error)
            alert('Unexpected error')
        } finally {
            setLoading(false)
        }
    }

    const downLoadCompiledPdf = () => {
        postAndHandle('http://localhost:3001/api/compilator/compile', async (res) => {
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'result.pdf'
            a.click()
            window.URL.revokeObjectURL(url)
        })
    }

    const saveCompiledPdf = () => {
        postAndHandle('http://localhost:3001/api/compilator/save', async (res) => {
            const json = await res.json()
            console.log('PDF saved in DB with ID:', json.id)
            alert('PDF successfully saved!')
        })
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
            <button className="compilator-button" onClick={saveCompiledPdf}>
                Save PDF
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
