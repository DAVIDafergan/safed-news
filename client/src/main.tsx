import './index.css'; 
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* הוספנו את זה */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
    <App />
  </React.StrictMode>
);