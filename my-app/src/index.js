import React, { useState} from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './componentes/login';
import Home from "./componentes/pages/inicio/home"

import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

function Root(){
  const [loggedIn, setLoggedIn] = useState(false);

  function handleLogin(event){
    event.preventDefault();
    setLoggedIn(true);
  }
  return loggedIn ? <Home /> : <Home onLogin={handleLogin} />
}
root.render(
  <React.StrictMode>


<Root />

  </React.StrictMode>
);

reportWebVitals();
