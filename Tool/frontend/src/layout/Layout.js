import {Fragment} from "react";
import Header from "./Header";
import {Outlet} from "react-router-dom";
import Box from "@mui/material/Box";


export default function Layout() {

    return (
        <Fragment>
            <Header/>
            <Box sx={{width: '990px', mr: 'auto', ml: 'auto'}}>
                <Outlet/>
            </Box>
        </Fragment>
    );
}