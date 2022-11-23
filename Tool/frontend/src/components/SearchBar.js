import {useState} from "react";
import TextField from "@mui/material/TextField";
import {InputAdornment} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";

export function SearchBar({width, placeholder, changeHandler}) {

    const [input, setInput] = useState('');

    const handleChange = (e) => {
        setInput(e.target.value);
        changeHandler(e.target.value);
    };

    const handleClear = (e) => {
        e.preventDefault();
        setInput('');
        changeHandler('');
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
                        <IconButton size="small" onMouseDown={handleClear}>
                            <ClearIcon fontSize="small"/>
                        </IconButton>
                    </InputAdornment>
                ),
                sx: {
                    paddingLeft: '10px',
                    paddingRight: 0
                }
            }}
            size="small"
            placeholder={placeholder}
            value={input}
            onChange={handleChange}
        />
    )
}