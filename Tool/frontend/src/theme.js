import {createTheme} from "@mui/material/styles";

export const appTheme = createTheme({
    components: {
        MuiButtonBase: {
            defaultProps: {
                disableTouchRipple: true
            }
        }
    }
});