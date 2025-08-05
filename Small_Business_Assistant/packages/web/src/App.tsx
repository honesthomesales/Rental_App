import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import JobsPage from './pages/JobsPage';
import CreateJobPage from './pages/CreateJobPage';
import JobDetailPage from './pages/JobDetailPage';
import QuotesPage from './pages/QuotesPage';
import InvoicesPage from './pages/InvoicesPage';
import ProfilePage from './pages/ProfilePage';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/create" element={<CreateJobPage />} />
          <Route path="jobs/:id" element={<JobDetailPage />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App; 