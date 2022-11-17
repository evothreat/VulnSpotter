import Typography from "@mui/material/Typography";
import * as React from "react";

export default function EmptyListMsg({text}) {
    return (
        <Typography align="center" color="#808080" padding="10px">
            {text}
        </Typography>
    );
}