import { useAuth } from '../../context/auth-context';
import { Dashboard } from '../dashboard/dashboard';
import { AdminDashboard } from '../dashboard/admin-dashboard';

export const HomePage = () => {
    const { isAdmin, loading } = useAuth();

    if (loading) {
        return <div>Carregando...</div>;
    }

    return isAdmin() ? <AdminDashboard /> : <Dashboard />;
}; 