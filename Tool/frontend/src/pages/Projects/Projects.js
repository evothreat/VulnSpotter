import {Fragment, useEffect, useState} from "react";
import Header from "../../layout/Header";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import ProjectTable from "./ProjectTable";
import AuthService from "../../services/AuthService";
import ProjectsService from "../../services/ProjectsService";


export function Projects() {
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

                {projects !== null ? <ProjectTable items={projects}
                                                   userId={AuthService.getCurrentUser().id}/> : <p>Loading projects...</p>}
            </Box>
        </Fragment>
    )
}