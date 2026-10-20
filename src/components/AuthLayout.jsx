
import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Protected({
    children,
    authentication = true,
    allowedRole,
    loading = false,
}) {
    const authStatus = useSelector((state) => state.auth.status);
    const role = localStorage.getItem("role");

    // Wait until App.jsx has restored the session.
    if (loading) {
        return <div className="p-6">Restoring session...</div>;
    }

    // Redirect logged-out users away from protected routes.
    if (authentication && !authStatus) {
        return <Navigate to="/login" replace />;
    }

    // Redirect authenticated users away from login/signup.
    if (!authentication && authStatus) {
        return (
            <Navigate
                to={role === "driver" ? "/driver/dashboard" : "/"}
                replace
            />
        );
    }

    // Enforce rider/driver dashboard roles.
    if (authentication && allowedRole && role !== allowedRole) {
        return (
            <Navigate
                to={role === "driver" ? "/driver/dashboard" : "/"}
                replace
            />
        );
    }

    return children;
}
