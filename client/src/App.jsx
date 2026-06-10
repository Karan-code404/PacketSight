import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import RequestAnalyzer from './pages/RequestAnalyzer';
import History from './pages/History';
import Analytics from './pages/Analytics';
import Health from './pages/Health';
import Insights from './pages/Insights';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<RequestAnalyzer />} />
            <Route path="history" element={<History />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="health" element={<Health />} />
            <Route path="insights" element={<Insights />} />
          </Route>
        </Routes>
      </Router>
      <Toaster 
        theme="dark" 
        closeButton 
        toastOptions={{
          style: {
            background: '#1A1D27',
            border: '1px solid #2A2D3E',
            color: '#E2E8F0',
            fontFamily: 'Inter, sans-serif'
          }
        }}
      />
    </ErrorBoundary>
  );
}

export default App;
