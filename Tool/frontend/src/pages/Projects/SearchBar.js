import {useRef} from "react";
import TextField from "@mui/material/TextField";
import {InputAdornment} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

export function SearchBar({width, placeholder, changeHandler}) {

    const inputRef = useRef();

    const handleChange = () => {
        if (changeHandler != null) {
            changeHandler(inputRef.current.value);
        }
    };

    const handleClear = () => {
        inputRef.current.value = '';
    };

    return (
        <TextField
            sx={{width: width}}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon/>
                    </InputAdornment>
                ),
                endAdornment: (
                    <InputAdornment position="start">
                        <IconButton size="small" onClick={handleClear}>
                            <ClearIcon fontSize="small"/>
                        </IconButton>
                    </InputAdornment>
                ),
                style: {
                    paddingLeft: '10px',
                    paddingRight: 0
                }
            }}
            size="small"
            placeholder={placeholder}
            inputRef={inputRef}
            onChange={handleChange}
        />
    )
}