import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import * as Utils from "../../utils";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import EnhancedTableHead from "../../components/EnhancedTableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Box from "@mui/material/Box";
import ActionTooltip from "../../components/ActionTooltip";
import IconButton from "@mui/material/IconButton";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Button from "@mui/material/Button";
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import {Role} from "../../constants";
import ConfirmDeleteDialog from "../../components/ConfirmDeleteDialog";
import MembersService from "../../services/MembersService";


const headCells = [
    {
        label: 'Name',
        width: '40%',
        key: 'full_name',
        sortable: true
    },
    {
        label: 'Username',
        width: '30%',
        key: 'username',
        sortable: true
    },
    {
        label: 'Role',
        sortable: true,
        key: 'role',
        width: '20%'
    },
    {
        label: '',
        sortable: false,
        width: '10%',
        align: 'right'
    }
];

const TABLE_HEIGHT = '460px';

const actionBtnStyle = {
    fontSize: '22px',
    padding: '4px 4px',
    color: '#707070'
};


function MembersList({items, setItemToDelete}) {

    const handleDelClick = (e) => {
        const itemId = parseInt(e.currentTarget.dataset.itemId);
        setItemToDelete(items.find((it) => it.id === itemId));
    };

    return (
        <TableBody>
            {
                items.length > 0
                    ? items.map((it) =>
                        <TableRow key={it.id} hover sx={{'& td': {height: '30px'}}}>
                            <TableCell>{it.full_name}</TableCell>
                            <TableCell>{it.username}</TableCell>
                            <TableCell>{Utils.capitalize(it.role)}</TableCell>
                            <TableCell align="right">
                                {
                                    it.role === Role.OWNER
                                        ? null
                                        : <Box sx={{display: 'flex', justifyContent: 'right'}}>
                                            <ActionTooltip title="Remove">
                                                <IconButton disableRipple sx={actionBtnStyle} data-item-id={it.id}
                                                            onClick={handleDelClick}>
                                                    <DeleteForeverIcon fontSize="inherit"/>
                                                </IconButton>
                                            </ActionTooltip>
                                        </Box>
                                }
                            </TableCell>
                        </TableRow>)
                    : <TableRow>
                        <TableCell colSpan="100%" sx={{border: 0, color: '#606060'}}>
                            There are no items to display
                        </TableCell>
                    </TableRow>
            }
        </TableBody>
    );
}

function MembersTable() {
    const [items, setItems] = useState(null);
    const [sorter, setSorter] = useState({
        order: 'asc',
        orderBy: 'full_name'
    });
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        MembersService.getAll()
            .then((resp) => setItems(resp.data));
    }, []);

    const sortItems = (key) => {
        const isAsc = sorter.orderBy === key && sorter.order === 'asc';

        setSorter({
            order: isAsc ? 'desc' : 'asc',
            orderBy: key
        });
    };

    const getItems = () => {
        return items.sort(Utils.createComparator(sorter.orderBy, sorter.order)).slice();
    };

    const handleDelete = () => {
        const itemId = itemToDelete.id;
        setItemToDelete(null);

        MembersService.delete(itemId)
            .then(() => {
                setItems((curItems) => curItems.filter((it) => it.id !== itemId));
            });
    };

    const clearItemToDelete = () => setItemToDelete(null);

    return (
        items == null
            ? <Typography variant="body2">Loading members...</Typography>
            : <Fragment>
                <TableContainer sx={{height: TABLE_HEIGHT}}>
                    <Table size="small" sx={{tableLayout: 'fixed'}} stickyHeader>
                        <EnhancedTableHead headCells={headCells}
                                           order={sorter.order}
                                           orderBy={sorter.orderBy}
                                           sortReqHandler={sortItems}/>
                        <MembersList items={getItems()} setItemToDelete={setItemToDelete}/>
                    </Table>
                </TableContainer>
                {
                    itemToDelete &&
                    <ConfirmDeleteDialog title="Remove Member" closeHandler={clearItemToDelete}
                                         deleteHandler={handleDelete}>
                        Are you sure you want to remove "{itemToDelete.full_name}" from project?
                    </ConfirmDeleteDialog>
                }
            </Fragment>

    );
}

export default function Members({project}) {
    return (
        <Fragment>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mt: '56px',
                mb: '30px'
            }}>
                <Typography variant="h6">
                    Members
                </Typography>
                <Button size="small" variant="contained" startIcon={<PersonAddAlt1Icon/>} sx={{textTransform: 'none'}}>
                    Invite
                </Button>
            </Box>
            <MembersTable project={project}/>
        </Fragment>
    );
}