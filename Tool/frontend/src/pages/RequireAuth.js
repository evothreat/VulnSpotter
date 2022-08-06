import {Navigate, Outlet, useLocation} from "react-router-dom";
import AuthHelper from "../helpers/auth";

export default function RequireAuth() {
    const location = useLocation();

    if (!AuthHelper.isLoggedIn()) {
        return <Navigate to='/login' state={{ from: location }} />;
    }
    return <Outlet />;
}