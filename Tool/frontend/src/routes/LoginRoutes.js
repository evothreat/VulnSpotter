import {Route, Routes} from "react-router-dom"

import Login from "../pages/Login";
import {PATH} from "../constants/paths";

export default function LoginRoutes() {
    return (
        <Routes>
            <Route
                path={PATH.LOGIN}
                element={<Login/>}
            />
        </Routes>
    )
}