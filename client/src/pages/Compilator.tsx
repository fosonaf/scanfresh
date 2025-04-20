import { useState } from 'react'
import { Circles } from 'react-loader-spinner'
import '../styles/compilator.css'

function Compilator() {
    const [urls, setUrls] = useState('')
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')

    const apiUrl = import.meta.env.VITE_API_URL + '/compilator'

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
                body: JSON.stringify({ urls, title }),
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
        postAndHandle(apiUrl + '/compile', async (res) => {
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'result.pdf'
            a.click()
            window.URL.revokeObjectURL(url)
        })
    }

    const saveCompiledPdf = async () => {
        setLoading(true)
        const urlsArray = urls.split('\n')

        const saveUrl = async (url: string, index: number) => {
            try {
                // Extraire le nom du fichier après le dernier slash de l'URL
                const fileName = url.trim().split('/').pop()

                let finalTitle: string
                if (title.trim()) {
                    // Si plusieurs URLs sont présentes, on incrémente avec un espace comme délimiteur
                    if (urlsArray.length > 1) {
                        finalTitle = `${index + 1} ${title}`
                    } else {
                        // Si une seule URL, on met simplement le title
                        finalTitle = title
                    }
                } else {
                    // Si pas de title, on utilise le suffixe de l'URL
                    finalTitle = fileName || `PDF-${index + 1}`
                }

                const res = await fetch(apiUrl + '/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urls: url.trim(), title: finalTitle }),
                })

                if (res.ok) {
                    console.log(`PDF ${index + 1} saved successfully with title: ${finalTitle}`)
                } else {
                    alert(`Failed to save PDF ${index + 1}.`)
                }
            } catch (err) {
                console.error(`Unexpected error saving PDF ${index + 1}:`, err)
                alert(`Unexpected error saving PDF ${index + 1}`)
            }
        }

        // Boucler sur toutes les URLs et appeler `saveUrl`
        for (const [index, url] of urlsArray.entries()) {
            await saveUrl(url, index)
        }

        setLoading(false) // Arrêter le loader après toutes les sauvegardes
    }

    return (
        <div className="compilator-container">
            <h1 className="compilator-title">Compile to PDF</h1>
            <input
                className="compilator-text-input compilator-input"
                type="text"
                placeholder="Enter PDF title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
                className="compilator-text-input compilator-textarea"
                placeholder="Paste your list of URLs here..."
                rows={10}
                value={urls}
                onChange={(e) => setUrls(e.target.value)}
            />
            <div className="actions">
                <button className="compilator-button" onClick={downLoadCompiledPdf}>
                    Submit
                </button>
                <button
                    className="compilator-button"
                    onClick={saveCompiledPdf}
                >
                    Save PDF
                </button>
            </div>

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
