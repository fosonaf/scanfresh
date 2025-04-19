import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import './Layout.css'

function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    return (
        <div className="layout">
            <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
