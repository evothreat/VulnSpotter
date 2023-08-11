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
import {ProjectProvider} from "./pages/Project/useProject";


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

function ProjectContext() {
    return (
        <ProjectProvider>
            <Outlet/>
        </ProjectProvider>
    );
}

export default function App() {
    return (
        <ThemeProvider theme={appTheme}>
            <BrowserRouter>
                <Routes>
                    <Route path="/home" element={<RequireAuth/>}>
                        <Route path="projects">
                            <Route index element={<Projects/>}/>
                            <Route path=":projId" element={<ProjectContext/>}>
                                <Route index element={<Project />} />
                                <Route path="explorer" element={<Explorer />} />
                            </Route>
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