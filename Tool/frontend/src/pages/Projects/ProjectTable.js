import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
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


function createComparator(key, order) {
    if (order === 'asc') {
        return (a, b) => a[key] > b[key] ? 1 : -1;
    }
    return (a, b) => a[key] < b[key] ? 1 : -1;
}

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

    const sorterRef = useRef({key: '', order: ''});
    const sorter = sorterRef.current;

    useEffect(() => {
        ProjectsService.getProjects()
            .then((resp) => {
                resp.data.forEach((p) => {
                    p.owner_name = p.owner.full_name;
                });
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
                        <TableCell>{p.owner_name}</TableCell>
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

    const createHeadCell = (key, name, width) => {
        return (
            <TableCell
                sx={{ fontWeight: 'bold', width: width }}
                sortDirection={sorter.key === key ? sorter.order : false}
            >
                <TableSortLabel
                    active={sorter.key === key}
                    direction={sorter.key === key ? sorter.order : 'asc'}
                    data-key={key}
                    onClick={reorderItems}
                >
                    {name}
                </TableSortLabel>
            </TableCell>
        );
    }

    const reorderItems = (e) => {
        sorter.key = e.currentTarget.dataset.key;
        sorter.order = sorter.order === 'asc' ? 'desc' : 'asc'

        const ordered = items.slice().sort(createComparator(sorter.key, sorter.order));
        setItems(ordered);
    }

    return (<TableContainer sx={{maxHeight: 500}}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        {createHeadCell('name', 'Name', '40%')}
                        {createHeadCell('owner_name', 'Owner', '35%')}
                        {createHeadCell('last_update', 'Updated', '20%')}
                        <TableCell sx={{width: '5%'}}/>
                    </TableRow>
                </TableHead>
                {itemsLoaded ? listItems() : <caption>Loading...</caption>}
            </Table>
        </TableContainer>);
}