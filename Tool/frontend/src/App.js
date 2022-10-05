import {BrowserRouter, Navigate, Outlet, Route, Routes} from "react-router-dom";
import {Fragment} from "react";
import Header from "./layout/Header";
import {Projects} from "./pages/Projects/Projects";
import Login from "./pages/Login/Login";
import {NotFound} from "./pages/NotFound";
import AuthService from "./services/AuthService";


function RequireAuth() {
    if (!AuthService.isLoggedIn()) {
        return <Navigate to="/login"/>;
    }
    return <Outlet/>;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth/>}>
                    <Route path="/projects" element={
                        <Fragment>
                            <Header/>
                            <Projects/>
                        </Fragment>
                    }/>
                </Route>
                <Route path="/login" element={<Login/>}/>
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
