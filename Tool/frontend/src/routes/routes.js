import {BrowserRouter} from "react-router-dom";
import LoginRoutes from "./Login";

export default function Routes() {
    return (
        <BrowserRouter>
            <LoginRoutes/>
        </BrowserRouter>
    )
}