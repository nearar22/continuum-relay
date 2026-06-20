import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { RelayProvider } from './context/RelayContext.jsx';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <RelayProvider>
          <App />
        </RelayProvider>
      </SettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
