import {Navigate, Outlet} from "react-router-dom";
import AuthUtil from "./utils/authUtil";

export default function RequireAuth() {
    if (!AuthUtil.isLoggedIn()) {
        return <Navigate to="/login"/>;
    }
    return <Outlet />;
}