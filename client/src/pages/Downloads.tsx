import { useEffect, useState } from 'react'

type DownloadEntry = {
    _id: string
    title?: string
    createdAt?: string
}

function Downloads() {
    const [pdfs, setPdfs] = useState<DownloadEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDownloads = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/downloads')
                const json = await res.json()
                if (res.ok) {
                    setPdfs(json.data)
                } else {
                    console.error('Failed to fetch pdfs:', json.error)
                }
            } catch (err) {
                console.error('Error fetching pdfs:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchDownloads()
    }, [])

    const downloadPdf = (id: string) => {
        const link = document.createElement('a')
        link.href = `http://localhost:3001/api/downloads/${id}`
        link.download = `${id}.pdf`
        link.click()
    }

    return (
        <div className="compilator-container">
            <h1 className="compilator-title">Downloads</h1>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul>
                    {pdfs.map((pdf) => (
                        <li key={pdf._id}>
                            <a href={`http://localhost:3001/api/downloads/${pdf._id}`} download>
                                {pdf.title?.trim() || pdf._id}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default Downloads
