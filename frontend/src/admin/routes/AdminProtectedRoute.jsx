import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminProtectedRoute({ children }) {

    const { currentUser } = useAuth();

    if(!currentUser){
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}