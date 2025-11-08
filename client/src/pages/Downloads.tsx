import { useState, useEffect } from 'react'
import { Circles } from 'react-loader-spinner'
import '../styles/compilator.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload, faTrash, faPen } from '@fortawesome/free-solid-svg-icons'

type DownloadEntry = {
    _id: string
    title?: string
    createdAt?: string
}

function Downloads() {
    const [pdfs, setPdfs] = useState<DownloadEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)

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

    const handleDownload = async (id: string, title?: string) => {
        setDownloadingId(id)
        setIsDownloading(true)

        try {
            const response = await fetch(`${apiUrl}/${id}`)

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${title ? title : id}.pdf`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Download error:', err)
        } finally {
            setDownloadingId(null)
            setIsDownloading(false)
        }
    }

    const handleEdit = (id: string) => {
        console.log(`Edit PDF ${id}`)
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

            {/* Overlay pour le loader */}
            {isDownloading && (
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
                                    onClick={() => handleDownload(pdf._id, pdf.title)}
                                    disabled={downloadingId === pdf._id}
                                >
                                    {truncateTitle(pdf.title?.trim() || pdf._id)}
                                </button>
                            </td>
                            <td className="datatable-action">
                                <button onClick={() => handleEdit(pdf._id)}>
                                    <FontAwesomeIcon icon={faPen} />
                                </button>
                            </td>
                            <td className="datatable-action">
                                <button
                                    onClick={() => handleDownload(pdf._id, pdf.title)}
                                    disabled={downloadingId === pdf._id}
                                >
                                    {downloadingId === pdf._id ? (
                                        <Circles
                                            height="20"
                                            width="20"
                                            color="black"
                                            ariaLabel="loading"
                                            wrapperClass="loading-wrapper"
                                        />
                                    ) : (
                                        <FontAwesomeIcon icon={faDownload} />
                                    )}
                                </button>
                            </td>
                            <td className="datatable-action">
                                <button onClick={() => handleDelete(pdf._id)}>
                                    <FontAwesomeIcon icon={faTrash} />
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
