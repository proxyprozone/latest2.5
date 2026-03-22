import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Shop from './pages/Shop';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Reviews from './pages/Reviews';
import { LanguageProvider } from './LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
