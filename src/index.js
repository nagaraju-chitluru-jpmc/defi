// In src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './frontend/App.css';
import App from './frontend/app.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);