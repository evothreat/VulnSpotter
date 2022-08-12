import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from "@mui/material/IconButton";
import {CircularProgress, TableSortLabel} from "@mui/material";
import {useEffect, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import TokenService from "../../services/TokenService";
import TimeUtil from "../../utils/TimeUtil";


export default function ProjectTable() {

    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        ProjectsService.getProjects()
            .then((resp) => {
                setProjects(resp.data);
                setIsLoading(false);
            })
            .catch((err) => {
                console.log('ProjectsService.getProjects:', err);
                TokenService.invalidate();
                window.location.replace('/login');
            });
    }, []);

    return (
        <TableContainer sx={{maxHeight: 500}}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{fontWeight: 'bold', width: '40%'}}>
                            <TableSortLabel>Name</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{fontWeight: 'bold', width: '35%'}}>
                            <TableSortLabel>Owner</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{fontWeight: 'bold', width: '20%'}}>
                            <TableSortLabel>Updated</TableSortLabel>
                        </TableCell>
                        <TableCell sx={{width: '5%'}}/>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {isLoading ? <CircularProgress/> :
                        (
                            projects.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell>
                                        {p.name}
                                    </TableCell>
                                    <TableCell>{p.owner.full_name}</TableCell>
                                    <TableCell>{TimeUtil.since(new Date(p.updated)) + ' ago'}</TableCell>
                                    <TableCell>
                                        <IconButton>
                                            <MoreVertIcon/>
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )
                    }
                </TableBody>
            </Table>
        </TableContainer>
    );
}