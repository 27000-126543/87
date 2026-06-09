import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useDataCenterStore } from '@/store/dataCenterStore';
import { useAlertStore } from '@/store/alertStore';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const { isAuthenticated } = useUserStore();
  const { fetchDataCenters } = useDataCenterStore();
  const { fetchAlerts } = useAlertStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    fetchDataCenters();
    fetchAlerts();
  }, [isAuthenticated, navigate, location.pathname, fetchDataCenters, fetchAlerts]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-custom grid-bg">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
