import LayoutHeader, {HEADER_HEIGHT} from "./LayoutHeader";
import {Outlet} from "react-router-dom";
import Box from "@mui/material/Box";


export default function Layout() {

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%'}}>
            <LayoutHeader/>
            <Box sx={{flex: '1', mt: HEADER_HEIGHT, display: 'flex', flexDirection: 'column', '> *': {flex: '1'}}}>
                <Outlet/>
            </Box>
        </Box>
    );
}