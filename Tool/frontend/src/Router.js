import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./pages/Login/Login";
import {NotFound} from "./pages/NotFound";
import RequireAuth from "./RequireAuth";
import {Projects} from "./pages/Projects/Projects";



export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route path="/projects" element={<Projects/>}/>
                </Route>
                <Route path="/login" element={<Login/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    );
}