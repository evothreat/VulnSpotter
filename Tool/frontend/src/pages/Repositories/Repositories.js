import {Fragment, useState} from "react";
import Header from "../../layout/Header";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import RepositoryTable from "./RepositoryTable";
import {FormControl, Select} from "@mui/material";
import MenuItem from "@mui/material/MenuItem";


export function Repositories() {

    //const [repos, setRepos] = useState([]);

    const [group, setGroup] = useState('all');

    const handleGroupChange = (event) => {
        setGroup(event.target.value);
    };

    return (
        <Fragment>
            <Header/>
            <Box sx={{mr: '20%', ml: '20%'}}>
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    mt: 6
                }}
                >
                    <Typography variant="h5">
                        Projects
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon/>}>
                        New
                    </Button>
                </Box>

                <Box sx={{mt: '24px', mb: '24px'}}>
                    <FormControl sx={{minWidth: 130}} size="small">
                        <Select value={group} onChange={handleGroupChange}>
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="personal">Personal</MenuItem>
                            <MenuItem value="favorites">Favorites</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <RepositoryTable group={group}/>
            </Box>
        </Fragment>
    )
}