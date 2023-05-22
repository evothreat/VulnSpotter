import {BrowserRouter, Navigate, Outlet, Route, Routes} from "react-router-dom";
import Projects from "./pages/Home/Projects";
import Project from "./pages/Project/Project";
import Login from "./pages/Auth/Login";
import NotFound from "./pages/NotFound";
import Layout from "./layout/Layout";
import TokenService from "./services/TokenService";
import Explorer from "./pages/Explorer/Explorer";
import {ThemeProvider} from "@mui/material/styles";
import {appTheme} from "./theme";
import Account from "./pages/Home/Account";
import Register from "./pages/Auth/Register";


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
        <ThemeProvider theme={appTheme}>
            <BrowserRouter>
                <Routes>
                    <Route path="/home" element={<RequireAuth/>}>
                        <Route path="projects">
                            <Route index element={<Projects/>}/>
                            <Route path=":projId" element={<Project/>}/>
                            <Route path=":projId/explorer" element={<Explorer/>}/>
                        </Route>
                        <Route path="account" element={<Account/>}/>
                    </Route>
                    <Route path="/" element={<Login/>}/>
                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>
                    <Route path="*" element={<NotFound/>}/>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}