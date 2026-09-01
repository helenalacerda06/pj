import './App.css';
import Header from './componentes/Header';
import Footer from './componentes/Footer';
import Login from './componentes/login';
import CriarAvaliacao from './componentes/pages/criarAvaliacao/criarAvaliação';

function App() {
  return (
    <div className="app-shell">
  
      <Header />
      <main className="app-main">
      <CriarAvaliacao />
      </main>
      <Footer />
    </div>
  );
}

export default App;
