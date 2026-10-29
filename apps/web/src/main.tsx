import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.js';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/landing.css';
import '@/styles/landing-usecases.css';
import '@/styles/landing-formats.css';
import '@/styles/landing-custom.css';
import '@/styles/landing-faq.css';
import '@/styles/shell.css';
import '@/styles/workspace.css';
import '@/styles/pages.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
