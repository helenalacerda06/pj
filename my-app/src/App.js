import './App.css';
import Header from './componentes/Header';
import Footer from './componentes/Footer';
import Login from './componentes/login';

function App() {
  return (
    <div className="app-shell">
  
      <Header />
      <main className="app-main">
        <Login />
      </main>
      <Footer />
    </div>
  );
}

export default App;
