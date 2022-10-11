import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {TableSortLabel} from "@mui/material";
import * as React from "react";


function EnhancedTableHead({headCells, order, orderBy, sortReqHandler}) {
    const handleSortClick = (e) => {
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
                        align={hc.align || 'left'}>
                        {
                            hc.sortable
                                ? <TableSortLabel
                                    active={hc.key === orderBy}
                                    direction={hc.key === orderBy ? order : 'asc'}
                                    data-key={hc.key}
                                    onClick={handleSortClick}>
                                    {hc.label}
                                </TableSortLabel>
                                : hc.label
                        }
                    </TableCell>)}
            </TableRow>
        </TableHead>
    )
}

export default EnhancedTableHead;