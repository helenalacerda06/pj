import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './componentes/login';
import Header from './componentes/Header';
import Footer from './componentes/Footer';

import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>


<Login />

  </React.StrictMode>
);

reportWebVitals();
