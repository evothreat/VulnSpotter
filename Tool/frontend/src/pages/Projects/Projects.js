import {Fragment, useEffect, useState} from "react";
import Header from "../../layout/Header";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectTable from "./ProjectTable";
import {FormControl, Select} from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import AuthService from "../../services/AuthService";
import ProjectsService from "../../services/ProjectsService";


export function Projects() {
    const userId = AuthService.getCurrentUser().id;

    const [group, setGroup] = useState('all');
    const [projects, setProjects] = useState(null);

    useEffect(() => {
        ProjectsService.getProjects()
            .then((resp) => {
                resp.data.forEach((p) => {
                    p.owner_name = p.owner.full_name;
                });
                setProjects(resp.data);
            })
            .catch((err) => {
                console.log('Projects.getProjects:', err);
            });
    }, []);

    const groupChangeHandler = (event) => {
        setGroup(event.target.value);
    };

    const getProjects = () => {
        return projects.filter((p) => group === 'all' ||
                                     (group === 'personal' && p.owner.id === userId) ||
                                     (group === 'starred' && p.starred));
    };

    return (
        <Fragment>
            <Header/>
            <Box sx={{mr: '17%', ml: '17%'}}>
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
                        <Select value={group} onChange={groupChangeHandler}>
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="personal">Personal</MenuItem>
                            <MenuItem value="starred">Starred</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                {projects !== null ? <ProjectTable items={getProjects()}/> : <p>Loading projects...</p>}
            </Box>
        </Fragment>
    )
}