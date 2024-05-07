import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {APIProvider} from "./APIProvider.tsx";
import {HistoryProvider} from "./HistoryContext.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <APIProvider>
            <HistoryProvider>
                <App/>
            </HistoryProvider>
        </APIProvider>
    </React.StrictMode>,
)
