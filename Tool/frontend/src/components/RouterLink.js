import {Link as RLink} from "react-router-dom";
import Link from "@mui/material/Link";
import * as React from "react";


export default function RouterLink(props) {
    return <Link component={RLink} {...props}/>;
}
