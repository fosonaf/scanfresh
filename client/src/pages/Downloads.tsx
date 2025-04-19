import { useEffect, useState } from 'react'

type DownloadEntry = {
    _id: string
    createdAt?: string
}

function Downloads() {
    const [downloads, setDownloads] = useState<DownloadEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDownloads = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/compilator/downloads')
                const json = await res.json()
                if (res.ok) {
                    setDownloads(json.data)
                } else {
                    console.error('Failed to fetch downloads:', json.error)
                }
            } catch (err) {
                console.error('Error fetching downloads:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchDownloads()
    }, [])

    const downloadPdf = (id: string) => {
        const link = document.createElement('a')
        link.href = `http://localhost:3001/api/compilator/downloads/${id}`
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
                    {downloads.map((entry) => (
                        <li key={entry._id}>
                            <button className="compilator-button" onClick={() => downloadPdf(entry._id)}>
                                {entry._id}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default Downloads
