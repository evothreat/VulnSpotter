import {BrowserRouter, Navigate, Outlet, Route, Routes} from "react-router-dom";
import Home from "./pages/Home/Home";
import Project from "./pages/Project/Project";
import Login from "./pages/Login/Login";
import NotFound from "./pages/NotFound";
import Layout from "./layout/Layout";
import TokenService from "./services/TokenService";


function RequireAuth() {
    if (TokenService.getUserId()) {
        return (
            <Layout>
                <Outlet/>
            </Layout>
        );
    }
    return <Navigate to="/login"/>;
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