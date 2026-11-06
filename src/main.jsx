import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { BookmarksProvider } from './context/BookmarksContext';
import { ApiKeyProvider } from './context/ApiKeyContext';
import { ToastProvider } from './components/Toast';

import './index.css';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ApiKeyProvider>
          <BookmarksProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </BookmarksProvider>
        </ApiKeyProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
