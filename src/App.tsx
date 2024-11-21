import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Share from './pages/Share';
import View from './pages/View';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/share" element={<Share />} />
        <Route path="/view" element={<View />} />
      </Routes>
    </Router>
  );
};

export default App;
