import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./componentes/pages/inicio/home";
import CriarAvaliação from "./componentes/pages/criarAvaliacao/criarAvaliação";

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route path="/criar-avaliacao" element={<Home />} />

                <Route
                    path="/criar-avaliacao"
                    element={<CriarAvaliação />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;