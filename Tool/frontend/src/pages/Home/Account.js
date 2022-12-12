import PageHeader from "../../components/PageHeader";
import Typography from "@mui/material/Typography";
import * as React from "react";
import LayoutBody from "../../layout/LayoutBody";
import {Stack} from "@mui/material";
import MainActionButton from "../../components/MainActionButton";
import FormTextField from "../../components/FormTextField";


export default function Account() {
    return (
        <LayoutBody>
            <PageHeader>
                <Typography variant="h6">
                    Account
                </Typography>
            </PageHeader>
            <Stack width="300px" gap="30px" mt="30px">
                <Stack gap="10px">
                    <FormTextField label="Full name"/>
                    <FormTextField label="Username"/>
                    <FormTextField label="E-Mail"/>
                </Stack>

                <Stack gap="10px">
                    <FormTextField label="Password" type="password"/>
                    <FormTextField label="Confirm password" type="password"/>
                </Stack>

                <Stack direction="row" gap="8px">
                    <MainActionButton>
                        Save
                    </MainActionButton>
                    <MainActionButton variant="outlined">
                        Cancel
                    </MainActionButton>
                </Stack>
            </Stack>
        </LayoutBody>
    );
}