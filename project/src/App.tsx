import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Droplet, Fuel, Truck, Store, CreditCard, Calendar, MapPin, Shield, CalendarClock } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeForm from './components/forms/EmployeeForm';
import ProductForm from './components/forms/ProductForm';
import TankForm from './components/forms/TankForm';
import PumpForm from './components/forms/PumpForm';
import SupplierForm from './components/forms/SupplierForm';
import ServiceForm from './components/forms/ServiceForm';
import SaleForm from './components/forms/SaleForm';
import Planning from './components/forms/Planning';
import Presence from './components/forms/Presence';
import StationForm from './components/forms/StationForm';
import Login from './components/forms/Login';
import Profile from './components/forms/Profile';
import Admin from './components/forms/Admin';
import ProfileEdit from './components/forms/ProfileEdit';
import { AuthProvider, useAuth } from './components/forms/AuthContext';
import ErrorBoundary from './components/forms/ErrorBoundary';

// Composant pour gérer les routes protégées avec le menu
const ProtectedLayout = () => {
  const { user, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Menu items for all users (excluding "Stations" and "Gestion des Utilisateurs")
  const menuItems = [
    { icon: LayoutDashboard, label: 'Tableau de bord', path: '/dashboard' },
    { icon: Users, label: 'Employés', path: '/employees' },
    { icon: Package, label: 'Produits', path: '/products' },
    { icon: Droplet, label: 'Citernes', path: '/tanks' },
    { icon: Fuel, label: 'Pompes', path: '/pumps' },
    { icon: Truck, label: 'Fournisseurs', path: '/suppliers' },
    { icon: Store, label: 'Services', path: '/services' },
    { icon: CreditCard, label: 'Ventes', path: '/sales' },
    { icon: Calendar, label: 'Planning', path: '/planning' },
    { icon: CalendarClock, label: 'Présences', path: '/presence' },
  ];

  // Add "Stations" and "Gestion des Utilisateurs" only for admins
  if (user?.role === 'admin') {
    menuItems.push(
      { icon: MapPin, label: 'Stations', path: '/stations' },
      { icon: Shield, label: 'Gestion des Utilisateurs', path: '/admin' }
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard onNewSale={() => window.location.href = '/sales'} />} />
          <Route path="/employees" element={<EmployeeForm />} />
          <Route path="/products" element={<ProductForm />} />
          <Route path="/tanks" element={<TankForm />} />
          <Route path="/pumps" element={<PumpForm />} />
          <Route path="/suppliers" element={<SupplierForm />} />
          <Route path="/services" element={<ServiceForm />} />
          <Route path="/sales" element={<SaleForm />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/presence" element={<Presence />} />
          <Route
            path="/stations"
            element={
              user?.role === 'admin' ? (
                <StationForm />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route
            path="/admin"
            element={
              user?.role === 'admin' ? (
                <Admin />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <Routes>
            {/* Route publique */}
            <Route path="/login" element={<Login />} />

            {/* Routes protégées avec Sidebar */}
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;