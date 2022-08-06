import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./Login";
import {NotFound} from "./NotFound";
import RequireAuth from "./RequireAuth";



export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route path="/" element={<h1>Accessing protected resource</h1>}/>
                </Route>
                <Route path="/login" element={<Login/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    );
}