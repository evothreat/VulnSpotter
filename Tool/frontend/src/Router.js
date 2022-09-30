import {BrowserRouter, Route, Routes} from "react-router-dom";
import Login from "./pages/Login/Login";
import {NotFound} from "./pages/NotFound";
import RequireAuth from "./RequireAuth";
import {Projects} from "./pages/Projects/Projects";
import Header from "./layout/Header";
import {Fragment} from "react";


export default function Router() {
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