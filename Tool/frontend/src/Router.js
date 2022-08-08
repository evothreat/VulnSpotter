import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./pages/Login";
import {NotFound} from "./pages/NotFound";
import RequireAuth from "./RequireAuth";
import {Repositories} from "./pages/Repositories";



export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route path="/repos" element={<Repositories/>}/>
                </Route>
                <Route path="/login" element={<Login/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    );
}