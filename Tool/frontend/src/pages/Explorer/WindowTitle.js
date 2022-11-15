import Typography from "@mui/material/Typography";
import React from "react";

export default function WindowTitle({title}) {
    return (
        <Typography fontSize="15px" bgcolor="#eaf0f7" color="#00000087" padding="7px 15px" textTransform="uppercase">
            {title}
        </Typography>
    );
}