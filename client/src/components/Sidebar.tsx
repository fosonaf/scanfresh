import { Link } from 'react-router-dom'
import './Sidebar.css'
import '../index.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

interface SidebarProps {
    isOpen: boolean
    onToggle: () => void
}

function Sidebar({ isOpen, onToggle }: SidebarProps) {
    return (
        <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <span className="sidebar-toggle" onClick={onToggle}>
                <FontAwesomeIcon icon="bars" />
            </span>
            <nav>
                <ul>
                    <li className="menu">
                        <Link to="/">
                            <FontAwesomeIcon className="menu-icon" icon="home" />
                            <span className="menu-label-wrapper">{isOpen && "Home"}</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/compilator">
                            <FontAwesomeIcon className="menu-icon" icon="upload"/>
                            <span className="menu-label-wrapper">{isOpen && "Compilator"}</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/downloads">
                            <FontAwesomeIcon className="menu-icon" icon="download"/>
                            <span className="menu-label-wrapper">{isOpen && "Downloads"}</span>
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    )
}

export default Sidebar
