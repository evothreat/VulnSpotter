import {createTheme} from "@mui/material/styles";

export const appTheme = createTheme({
    components: {
        MuiButtonBase: {
            defaultProps: {
                disableTouchRipple: true
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none'
                }
            }
        },
        MuiAutocomplete: {
            defaultProps: {
                ListboxProps: {
                    sx: {
                        maxHeight: '210px'
                    }
                }
            }
        }
    }
});