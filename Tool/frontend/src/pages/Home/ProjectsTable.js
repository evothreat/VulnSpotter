import * as React from 'react';
import {Fragment, useEffect, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import {Dialog, DialogActions, DialogContent, DialogTitle, ToggleButton, ToggleButtonGroup,} from "@mui/material";
import {SearchBar} from "@components/SearchBar";
import Box from "@mui/material/Box";
import * as Utils from "@utils/common";
import {fmtTimeSince} from "@utils/common";
import Button from "@mui/material/Button";
import ProjectsService from "@services/ProjectsService";
import TextField from "@mui/material/TextField";
import EnhancedTableHead from "@components/EnhancedTableHead";
import TokenService from "@services/TokenService";
import ConfirmActDialog from "@components/ConfirmActDialog";
import RouterLink from "@components/RouterLink";
import ActionButton from "@components/ActionButton";
import LogoutIcon from '@mui/icons-material/Logout';


const headCells = [
    {
        content: 'Name',
        key: 'name',
        sortable: true,
        width: '25%'
    },
    {
        content: 'Owner',
        key: 'owner_name',
        sortable: true,
        width: '25%'
    },
    {
        content: 'Repository',
        key: 'repository',
        sortable: true,
        width: '25%'
    },
    {
        content: 'Created',
        key: 'created_at',
        sortable: true,
        width: '15%'
    },
    {
        width: '10%',
        align: 'right'
    }
];

function RenameProjectDialog({proj, closeHandler, renameHandler}) {

    const handleSubmit = e => {
        e.preventDefault();
        renameHandler(e.target.projName.value);
    };

    return (
        <Dialog open={true} onClose={closeHandler} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Rename Project</DialogTitle>
                <DialogContent>
                    <TextField name="projName" margin="dense" label="Project name"
                               defaultValue={proj.name} fullWidth required autoFocus/>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeHandler} variant="outlined">Cancel</Button>
                    <Button type="submit" variant="contained">Rename</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}

function ProjectRow({proj, deleteHandler, renameHandler, leaveHandler}) {
    return (
        <TableRow key={proj.id} hover sx={{'& td': {height: '30px'}}}>
            <TableCell>
                <RouterLink underline="hover" to={`/home/projects/${proj.id}`}>{proj.name}</RouterLink>
            </TableCell>
            <TableCell>{proj.personal ? 'Me' : proj.owner_name}</TableCell>
            <TableCell>{proj.repository.substring(proj.repository.indexOf('/') + 1)}</TableCell>
            <TableCell>{fmtTimeSince(proj.created_at) + ' ago'}</TableCell>
            <TableCell align="right">
                <Box sx={{display: 'flex', justifyContent: 'right'}}>
                    {
                        proj.personal
                            ? (
                                <Fragment>
                                    <ActionButton onClick={() => renameHandler(proj)}>
                                        <DriveFileRenameOutlineIcon fontSize="inherit"/>
                                    </ActionButton>

                                    <ActionButton onClick={() => deleteHandler(proj)}>
                                        <DeleteForeverIcon fontSize="inherit"/>
                                    </ActionButton>
                                </Fragment>
                            )
                            : (
                                <ActionButton onClick={() => leaveHandler(proj)}>
                                    <LogoutIcon fontSize="inherit"/>
                                </ActionButton>
                            )
                    }
                </Box>

            </TableCell>
        </TableRow>
    );
}

export default function ProjectsTable() {
    const [projects, setProjects] = useState(null);
    const [group, setGroup] = useState('all');
    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'created_at'
    });
    const [searchKw, setSearchKw] = useState('');
    const [projToDelete, setProjToDelete] = useState(null);
    const [projToRename, setProjToRename] = useState(null);
    const [projToLeave, setProjToLeave] = useState(null);

    useEffect(() => {
        ProjectsService.getAll()
            .then(data => {
                const userId = TokenService.getUserId();

                data.forEach(p => {
                    p.owner_name = p.owner.full_name;
                    p.personal = userId === p.owner.id;
                });
                setProjects(data);
            });
    }, []);

    const handleGroupChange = (e, val) => {
        // If the user presses the same button twice (i.e. deselects option), do nothing (replace later with radio buttons).
        if (val) {
            setGroup(val);
        }
    };

    const sortProjects = key => {
        setSorter({
            order: sorter.orderBy === key && sorter.order === 'asc' ? 'desc' : 'asc',
            orderBy: key
        });
    };

    const getProjects = () => {
        if (!projects) {
            return null;
        }
        return projects.filter(it => (group === 'all' ||
                                     (group === 'personal' && it.personal)) &&
                                     it.name.toLowerCase().includes(searchKw.toLowerCase()))
                       .sort(Utils.createComparator(sorter.orderBy, sorter.order));
    };

    const handleDelete = () => {
        const projId = projToDelete.id;
        setProjToDelete(null);

        ProjectsService.delete(projId)
            .then(() => {
                setProjects(curProjects => Utils.remove(curProjects, projId));
            });
    };

    const handleRename = newName => {
        const projId = projToRename.id;
        setProjToRename(null);

        ProjectsService.update(projId, {'name': newName})
            .then(() => {
                setProjects(curProjects => {
                        curProjects.find(it => it.id === projId).name = newName;
                        return curProjects.slice();
                    }
                );
            });
    };
    
    const handleLeave = () => {
        const projId = projToLeave.id;
        setProjToLeave(null);

        ProjectsService.removeMember(projId, TokenService.getUserId())
            .then(() => {
                setProjects(curProjects => Utils.remove(curProjects, projId));
            });
    }

    const orderedProjects = getProjects();
    return (
        <Fragment>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mb: '12px'
            }}>
                <ToggleButtonGroup color="primary" value={group} exclusive size="small" onChange={handleGroupChange}
                                   sx={{height: '35px'}}>
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="personal">Personal</ToggleButton>
                </ToggleButtonGroup>

                <SearchBar width="260px" placeholder="Search by name" changeHandler={kw => setSearchKw(kw)}/>
            </Box>

            <TableContainer sx={{height: '465px'}}>
                <Table size="small" stickyHeader sx={{tableLayout: 'fixed'}}>
                    <EnhancedTableHead
                        headCells={headCells}
                        order={sorter.order}
                        orderBy={sorter.orderBy}
                        sortReqHandler={sortProjects}/>
                    {
                        orderedProjects && (
                            <TableBody>
                                {
                                    orderedProjects.length > 0
                                        ? orderedProjects.map(it =>
                                            <ProjectRow proj={it} 
                                                        deleteHandler={setProjToDelete}
                                                        renameHandler={setProjToRename}
                                                        leaveHandler={setProjToLeave}
                                            />
                                        )
                                        : <TableRow>
                                            <TableCell colSpan="100%" sx={{border: 0, color: '#606060'}}>
                                                There are no projects to display
                                            </TableCell>
                                        </TableRow>
                                }
                            </TableBody>
                        )
                    }
                </Table>
            </TableContainer>
            {
                projToRename &&
                <RenameProjectDialog proj={projToRename} renameHandler={handleRename}
                                     closeHandler={() => setProjToRename(null)}/>
            }
            {
                projToDelete &&
                <ConfirmActDialog title="Delete Project" confirmTitle="Delete"
                                     closeHandler={() => setProjToDelete(null)}
                                     confirmHandler={handleDelete}>
                    Are you sure you want to permanently delete the <b>{projToDelete.name}</b>-Project?
                </ConfirmActDialog>
            }
            {
                projToLeave &&
                <ConfirmActDialog title="Leave Project" confirmTitle="Leave"
                                     closeHandler={() => setProjToLeave(null)}
                                     confirmHandler={handleLeave}>
                    Are you sure you want to leave the <b>{projToLeave.name}</b>-Project?
                </ConfirmActDialog>
            }
        </Fragment>
    );
}