import {Fragment, useEffect, useState} from "react";
import Header from "../../layout/Header";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectTable from "./ProjectTable";
import {ToggleButtonGroup} from "@mui/material";
import AuthService from "../../services/AuthService";
import ProjectsService from "../../services/ProjectsService";
import {ToggleButton} from "@mui/lab";
import {SearchBar} from "./SearchBar";


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
                    mt: '56px',
                    mb: '24px'
                }}>
                    <Typography variant="h5">
                        Projects
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon/>}>
                        New
                    </Button>
                </Box>

                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: '12px'
                }}>
                    <ToggleButtonGroup color="primary" value={group} exclusive size="small" onChange={groupChangeHandler}>
                        <ToggleButton value="all">All</ToggleButton>
                        <ToggleButton value="personal">Personal</ToggleButton>
                        <ToggleButton value="starred">Starred</ToggleButton>
                    </ToggleButtonGroup>
                    <SearchBar width="260px" placeholder="Search by name"/>
                </Box>
                {projects !== null ? <ProjectTable items={getProjects()}/> : <p>Loading projects...</p>}
            </Box>
        </Fragment>
    )
}