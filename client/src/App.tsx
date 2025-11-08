import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Compilator from './pages/Compilator';
import Downloads from './pages/Downloads.tsx';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Compilator />} />
                <Route path='/downloads' element={<Downloads />} />
            </Route>
        </Routes>
    );
}

export default App;
