import PageHeader from "../../components/PageHeader";
import Typography from "@mui/material/Typography";
import * as React from "react";
import Box from "@mui/material/Box";


export default function Account() {
    return (
        <Box sx={{width: '990px', mr: 'auto', ml: 'auto'}}>
            <PageHeader>
                <Typography variant="h6">
                    Account
                </Typography>
            </PageHeader>
        </Box>
    );
}