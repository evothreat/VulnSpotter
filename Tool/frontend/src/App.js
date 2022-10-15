import {BrowserRouter, Navigate, Outlet, Route, Routes} from "react-router-dom";
import Home from "./pages/Home/Home";
import Project from "./pages/Project/Project";
import Login from "./pages/Login/Login";
import NotFound from "./pages/NotFound";
import AuthService from "./services/AuthService";
import Layout from "./layout/Layout";


function RequireAuth() {
    if (!AuthService.isLoggedIn()) {
        return <Navigate to="/login"/>;
    }
    return (
        <Layout>
            <Outlet/>
        </Layout>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/home" element={<RequireAuth/>}>
                    <Route path="" element={<Home/>}/>
                    <Route path="projects/:projId" element={<Project/>}/>
                </Route>
                <Route path="/login" element={<Login/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    );
}