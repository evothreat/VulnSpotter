import Header from "./Header";
import {Outlet} from "react-router-dom";
import Box from "@mui/material/Box";


export default function Layout() {

    return (
        <Box display="flex" flexDirection="column" height="100%" width="100%">
            <Header/>
            <Outlet/>
        </Box>
    );
}