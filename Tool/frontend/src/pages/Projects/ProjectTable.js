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


const headCells = [
    {
        label: 'Name',
        key: 'name',
        sortable: true,
        width: '40%'
    },
    {
        label: 'Owner',
        key: 'owner_name',
        sortable: true,
        width: '35%'
    },
    {
        label: 'Updated',
        key: 'last_update',
        sortable: true,
        width: '20%'
    },
    {
        label: '',
        key: 'action',
        sortable: false,
        width: '5%'
    }
];


function createComparator(key, order) {
    if (order === 'asc') {
        return (a, b) => a[key] > b[key] ? 1 : -1;
    }
    return (a, b) => a[key] < b[key] ? 1 : -1;
}

function applyGroupFilter(items, group) {
    const userId = AuthService.getCurrentUser().id;

    return items.map((it) => {
        it.visible = group === 'all' || (group === 'personal' && it.owner.id === userId) || (group === 'starred' && it.starred);
        return it;
    });
}

function ProjectTableHead({order, orderBy, sortReqHandler}) {
    const handleClick = (e) => {
        sortReqHandler(e.currentTarget.dataset.key);
    };
    return (
        <TableHead>
            <TableRow key="head">
                {headCells.map((hc) =>
                    <TableCell
                        key={hc.key}
                        sx={{fontWeight: 'bold', width: hc.width}}
                        sortDirection={orderBy === hc.key ? order : false}
                    >
                        {hc.sortable ?
                            <TableSortLabel
                                active={hc.key === orderBy}
                                direction={hc.key === orderBy ? order : 'asc'}
                                data-key={hc.key}
                                onClick={handleClick}
                            >
                                {hc.label}
                            </TableSortLabel>
                            : hc.label}
                    </TableCell>)}
            </TableRow>
        </TableHead>
    )
}

function ProjectTableList({items}) {
    if (items.length === 0) {
        return <caption>There are no items to display.</caption>;
    }
    return <TableBody>
        {items.map((p) =>
            <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.owner_name}</TableCell>
                <TableCell>{TimeUtil.since(new Date(p.last_update)) + ' ago'}</TableCell>
                <TableCell>
                    <IconButton>
                        <MoreVertIcon/>
                    </IconButton>
                </TableCell>
            </TableRow>)}
    </TableBody>
}

export default function ProjectTable(props) {

    const [items, setItems] = useState([]);
    const [itemsLoaded, setItemsLoaded] = useState(false);

    const [sorter, setSorter] = useState({
        order: 'desc',
        orderBy: 'last_update'
    });

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

    const sortReqHandler = (key) => {
        const isAsc = sorter.orderBy === key && sorter.order === 'asc';

        setSorter({
            order: isAsc ? 'desc' : 'asc',
            orderBy: key
        });
    }

    const getItems = () => {
        return items.sort(createComparator(sorter.orderBy, sorter.order))           // sorting all items
                    .filter((it) => it.visible);
    };

    return (
        <TableContainer sx={{maxHeight: 500}}>
            <Table size="small" stickyHeader>
                <ProjectTableHead
                    order={sorter.order}
                    orderBy={sorter.orderBy}
                    sortReqHandler={sortReqHandler}/>
                {itemsLoaded ? <ProjectTableList items={getItems()}/> : <caption>Loading...</caption>}
            </Table>
        </TableContainer>
    );
}