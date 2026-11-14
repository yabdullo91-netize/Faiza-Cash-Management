import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './app/App';
import './styles/app.css';
import './styles/refinements.css';
import './styles/password-input.css';
import './styles/access-management.css';
createRoot(document.getElementById('root')).render(<App/>);
