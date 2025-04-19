import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Compilator from './pages/Compilator';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="compilator" element={<Compilator />} />
            </Route>
        </Routes>
    );
}

export default App;
