import { useState } from 'react'
import { Circles } from 'react-loader-spinner'
import '../styles/compilator.css'

function Compilator() {
    const [urls, setUrls] = useState('')
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [error, setError] = useState('')

    const apiUrl = import.meta.env.VITE_API_URL + '/compilator'

    // Secure URL validation
    const isValidUrl = (urlString: string): boolean => {
        try {
            const url = new URL(urlString.trim())
            // Check that it's HTTP or HTTPS
            return url.protocol === 'http:' || url.protocol === 'https:'
        } catch {
            return false
        }
    }

    // Validate and clean URLs
    const validateUrls = (input: string): { valid: boolean; urls: string[]; error: string } => {
        const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0)
        
        // Maximum 4 lines
        if (lines.length > 4) {
            return { valid: false, urls: [], error: 'Maximum 4 URLs allowed' }
        }

        // Check that each line is a valid URL
        const validUrls: string[] = []
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            // Check that there are no spaces or additional characters
            if (line.includes(' ') || line !== line.trim()) {
                return { valid: false, urls: [], error: `Line ${i + 1}: only one URL per line, no additional text` }
            }
            
            if (!isValidUrl(line)) {
                return { valid: false, urls: [], error: `Line ${i + 1}: invalid URL` }
            }
            
            validUrls.push(line)
        }

        return { valid: true, urls: validUrls, error: '' }
    }

    const handleUrlsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const input = e.target.value
        const lines = input.split('\n')
        
        // Strictly limit to 4 lines maximum
        if (lines.length > 4) {
            // Keep only the first 4 lines
            const limitedLines = lines.slice(0, 4).join('\n')
            setUrls(limitedLines)
            setError('Maximum 4 URLs allowed')
            return
        }

        setUrls(input)
        setError('')
    }

    const postAndHandle = async (
        endpoint: string,
        urlsToSend: string,
        onSuccess: (res: Response) => Promise<void>
    ) => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ urls: urlsToSend, title }),
            })

            if (res.ok) {
                await onSuccess(res)
            } else {
                const json = await res.json()
                console.error('Error from API:', json.error)
                setError('Operation error')
            }
        } catch (error) {
            console.error('Network or server error:', error)
            setError('Network error')
        } finally {
            setLoading(false)
        }
    }

    const downLoadCompiledPdf = () => {
        const validation = validateUrls(urls)
        if (!validation.valid) {
            setError(validation.error)
            return
        }

        const urlsToSend = validation.urls.join('\n')
        
        postAndHandle(apiUrl + '/compile', urlsToSend, async (res) => {
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
        const validation = validateUrls(urls)
        if (!validation.valid) {
            setError(validation.error)
            return
        }

        setLoading(true)
        const urlsArray = validation.urls

        const saveUrl = async (url: string, index: number) => {
            try {
                // Extract the file name after the last slash of the URL
                const fileName = url.trim().split('/').pop()

                let finalTitle: string
                if (title.trim()) {
                    // If multiple URLs are present, increment with a space as delimiter
                    if (urlsArray.length > 1) {
                        finalTitle = `${index + 1} ${title}`
                    } else {
                        // If only one URL, just use the title
                        finalTitle = title
                    }
                } else {
                    // If no title, use the URL suffix
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

        // Loop through all URLs and call `saveUrl`
        for (const [index, url] of urlsArray.entries()) {
            await saveUrl(url, index)
        }

        setLoading(false) // Stop loader after all saves
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
                placeholder="Paste your URLs here (one URL per line, maximum 4)..."
                rows={4}
                maxLength={2000}
                value={urls}
                onChange={handleUrlsChange}
            />
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
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
