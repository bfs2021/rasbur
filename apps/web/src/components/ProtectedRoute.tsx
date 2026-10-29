import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.js';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (
            <div className="sh-loading" role="status">
                <span className="sh-loading-mark" aria-hidden="true" />
                Checking your session
            </div>
        );
    }

    if (!isAuthenticated) {
        // Stash the intended path so AuthCallbackPage can return here after the OAuth
        // round-trip (React Router location state does not survive the external redirect).
        localStorage.setItem('redirectAfterLogin', location.pathname + location.search);
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
}
