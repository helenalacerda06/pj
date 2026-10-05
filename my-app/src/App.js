import { Routes, Route } from 'react-router-dom';

import Home from './componentes/pages/inicio/home';
import CriarAvaliacao from './componentes/pages/criarAvaliacao/criarAvaliacao';
import Login from "./componentes/login";
import Cadastrar from './componentes/cadastrar';
import MinhasAva from './componentes/pages/minhasAva/minhasAva';

function App() {
    return (
        <Routes>
            <Route path="/" element={<Cadastrar />} />
            <Route path="/home" element={<Home />} />
            <Route path="/criar-avaliacao" element={<CriarAvaliacao />} />
            <Route path='/login' element={<Login />} />
            <Route path='/minhasava' element={<MinhasAva />} />
        </Routes>
    );
}

export default App;