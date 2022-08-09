import {Navigate, Outlet, useLocation} from "react-router-dom";
import AuthUtil from "./utils/authUtil";

export default function RequireAuth() {
    const location = useLocation();

    if (!AuthUtil.isLoggedIn()) {
        return <Navigate to='/login' state={{ from: location }} />;
    }
    return <Outlet />;
}