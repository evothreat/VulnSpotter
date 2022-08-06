import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./Login";
import {NotFound} from "./NotFound";

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    );
}