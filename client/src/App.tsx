// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout'; // Import du composant Layout
import Home from './pages/Home'; // Page d'accueil
import Compilator from './pages/Compilator'; // Page du compilateur

function App() {
    return (
        <Routes>
            {/* Définition de la route principale avec le Layout */}
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} /> {/* Accueil */}
                <Route path="compilateur" element={<Compilator />} /> {/* Compilateur */}
            </Route>
        </Routes>
    );
}

export default App;
