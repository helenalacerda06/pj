import './App.css';
import Header from './componentes/Header';
import Footer from './componentes/Footer';

function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <h2>Bem-vindo ao meu app</h2>

      </main>
      <Footer />
    </div>
  );
}

export default App;
