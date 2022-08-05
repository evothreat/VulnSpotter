import {BrowserRouter} from "react-router-dom";
import LoginRoutes from "./LoginRoutes";

export default function Routes() {
    return (
        <BrowserRouter>
            <LoginRoutes/>
        </BrowserRouter>
    )
}