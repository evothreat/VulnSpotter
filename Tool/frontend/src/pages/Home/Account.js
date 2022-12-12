import PageHeader from "../../components/PageHeader";
import Typography from "@mui/material/Typography";
import * as React from "react";
import LayoutBody from "../../layout/LayoutBody";
import {Stack} from "@mui/material";
import TextField from "@mui/material/TextField";
import MainActionButton from "../../components/MainActionButton";


export default function Account() {
    return (
        <LayoutBody>
            <PageHeader>
                <Typography variant="h6">
                    Account
                </Typography>
            </PageHeader>
            <Stack width="300px" gap="30px">
                <Stack gap="10px">
                    <TextField
                        size="small"
                        variant="outlined"
                        label="Full name"
                    />
                    <TextField
                        size="small"
                        variant="outlined"
                        label="Username"
                    />
                    <TextField
                        size="small"
                        variant="outlined"
                        label="E-Mail"
                    />
                </Stack>
                <Stack gap="10px" width="300px">
                    <TextField
                        size="small"
                        variant="outlined"
                        label="Password"
                    />
                    <TextField
                        size="small"
                        variant="outlined"
                        label="Confirm password"
                    />
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