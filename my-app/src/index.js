import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import Login from './componentes/login'
import Header from './componentes/Header'

const root = ReactDOM.createRoot(document.getElementById('root'));
<Header />
root.render(
  
    <BrowserRouter>
    <App />
    </BrowserRouter>
);