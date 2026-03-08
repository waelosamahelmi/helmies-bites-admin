import { Routes, Route, useLocation } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Tenants } from './components/Tenants';
import { TenantDetail } from './components/TenantDetail';
import { Orders } from './components/Orders';
import { Analytics } from './components/Analytics';
import { Support } from './components/Support';
import { Loyalty } from './pages/Loyalty';
import { Customers } from './pages/Customers';
import { Coupons } from './pages/Coupons';
import { Settings } from './pages/Settings';
import { Branches } from './pages/Branches';
import { Lounas } from './pages/Lounas';
import { Menu } from './pages/Menu';
import Wizard from './pages/Wizard';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isWizard = location.pathname.startsWith('/wizard');

  if (isWizard) {
    return (
      <Routes>
        <Route path="/wizard" element={<Wizard />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/tenants/:id" element={<TenantDetail />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/loyalty" element={<Loyalty />} />
        <Route path="/coupons" element={<Coupons />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/lounas" element={<Lounas />} />
        <Route path="/support" element={<Support />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MainLayout>
  );
}
