import { Link } from 'react-router-dom'
import './Sidebar.css'

interface SidebarProps {
    isOpen: boolean
    onToggle: () => void
}

function Sidebar({ isOpen, onToggle }: SidebarProps) {
    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <button className="sidebar-toggle" onClick={onToggle}>
                ☰
            </button>
            {isOpen && (
                <nav>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/compilator">Compilator</Link></li>
                        <li><Link to="/downloads">Downloads</Link></li>
                    </ul>
                </nav>
            )}
        </div>
    )
}

export default Sidebar
