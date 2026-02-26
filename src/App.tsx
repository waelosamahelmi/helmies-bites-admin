import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { Tenants } from './components/Tenants';
import { TenantDetail } from './components/TenantDetail';
import { Orders } from './components/Orders';
import { Analytics } from './components/Analytics';
import { Support } from './components/Support';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/tenants/:id" element={<TenantDetail />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/support" element={<Support />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
