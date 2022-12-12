import PageHeader from "../../components/PageHeader";
import Typography from "@mui/material/Typography";
import * as React from "react";
import LayoutBody from "../../layout/LayoutBody";


export default function Account() {
    return (
        <LayoutBody>
            <PageHeader>
                <Typography variant="h6">
                    Account
                </Typography>
            </PageHeader>
        </LayoutBody>
    );
}