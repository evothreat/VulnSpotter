import {Fade, Tooltip} from "@mui/material";
import * as React from "react";


const tooltipStyle = {
    tooltip: {
        sx: {
            bgcolor: 'common.black',
            '& .MuiTooltip-arrow': {
                color: 'common.black',
            },
        },
    }
};

export default function ActionTooltip({children, ...props}) {
    return (
        <Tooltip placement="top"
                 arrow
                 TransitionComponent={Fade}
                 componentsProps={tooltipStyle}
                 children={children}
                 {...props}
        />
    );
}