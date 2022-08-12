import {Navigate, Outlet} from "react-router-dom";
import AuthService from "./services/AuthService";

export default function RequireAuth() {

    if (!AuthService.isLoggedIn()) {
        return <Navigate to="/login"/>;
    }
    return <Outlet />;
}