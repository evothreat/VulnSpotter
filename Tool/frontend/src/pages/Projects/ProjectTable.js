import * as React from 'react';
import {useEffect, useState} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import IconButton from "@mui/material/IconButton";
import {TableSortLabel} from "@mui/material";
import ProjectsService from "../../services/ProjectsService";
import TimeUtil from "../../utils/TimeUtil";
import AuthService from "../../services/AuthService";


function applyGroupFilter(items, group) {
    const userId = AuthService.getCurrentUser().id;

    return items.map((p) => {
        p.visible = group === 'all' || (group === 'personal' && p.owner.id === userId) || (group === 'starred' && p.starred);
        return p;
    });
}

export default function ProjectTable(props) {

    const [items, setItems] = useState([]);
    const [itemsLoaded, setItemsLoaded] = useState(false);

    useEffect(() => {
        ProjectsService.getProjects()
            .then((resp) => {
                setItems(resp.data);
                setItemsLoaded(true);
            })
            .catch((err) => {
                console.log('ProjectsService.getProjects:', err);
                AuthService.logout();
                window.location.replace('/login');
            });
    }, []);

    useEffect(() => {
        if (items !== null) {
            setItems(applyGroupFilter(items, props.group));
        }
    }, [props.group, itemsLoaded]);

    const listItems = () => {
        const rows = [];
        for (const p of items) {
            if (p.visible) {
                rows.push(
                    <TableRow key={p.id}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{p.owner.full_name}</TableCell>
                        <TableCell>{TimeUtil.since(new Date(p.last_update)) + ' ago'}</TableCell>
                        <TableCell>
                            <IconButton>
                                <MoreVertIcon/>
                            </IconButton>
                        </TableCell>
                    </TableRow>
                );
            }
        }
        return rows.length > 0 ?
            <TableBody>{rows}</TableBody> :
            <caption>There are no items to display.</caption>;
    };

    return (<TableContainer sx={{maxHeight: 500}}>
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
                {itemsLoaded ? listItems() : <caption>Loading...</caption>}
            </Table>
        </TableContainer>);
}