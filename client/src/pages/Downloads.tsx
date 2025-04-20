import { useEffect, useState } from 'react'
import '../styles/index.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

type DownloadEntry = {
    _id: string
    title?: string
    createdAt?: string
}

function Downloads() {
    const [pdfs, setPdfs] = useState<DownloadEntry[]>([])
    const [loading, setLoading] = useState(true)

    const apiUrl = import.meta.env.VITE_API_URL + '/downloads'

    const fetchDownloads = async () => {
        try {
            const res = await fetch(apiUrl)
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

    useEffect(() => {
        fetchDownloads()
    }, [])

    const handleDownload = (id: string) => {
        const link = document.createElement('a')
        link.href = `${apiUrl}/${id}`
        link.download = `${id}.pdf`
        link.click()
    }

    const handleEdit = (id: string) => {
        console.log(`Modifier PDF ${id}`)
    }

    const handleDelete = async (id: string) => {
        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE',
            })

            const json = await response.json()

            if (response.ok) {
                setPdfs(pdfs.filter(pdf => pdf._id !== id))
            } else {
                console.error('Failed to delete PDF:', json.error)
            }
        } catch (err) {
            console.error('Error deleting PDF:', err)
        }
    }

    const truncateTitle = (title: string, maxLength = 28) => {
        if (title.length < maxLength) return title
        return title.slice(0, maxLength) + '…'
    }

    return (
        <div className="compilator-container">
            <h1 className="compilator-title">Downloads</h1>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table className="datatable">
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>Modify</th>
                        <th>Download</th>
                        <th>Delete</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pdfs.map((pdf) => (
                        <tr key={pdf._id}>
                            <td>
                                <button
                                    className="datatable-link"
                                    onClick={() => handleDownload(pdf._id)}
                                >
                                    {truncateTitle(pdf.title?.trim() || pdf._id)}
                                </button>
                            </td>
                            <td className="datatable-action">
                                <button onClick={() => handleEdit(pdf._id)}>
                                    <FontAwesomeIcon icon="pen" />
                                </button>
                            </td>
                            <td className="datatable-action">
                                <button onClick={() => handleDownload(pdf._id)}>
                                    <FontAwesomeIcon icon="download" />
                                </button>
                            </td>
                            <td className="datatable-action">
                                <button onClick={() => handleDelete(pdf._id)}>
                                    <FontAwesomeIcon icon="trash" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}

export default Downloads
