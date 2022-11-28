import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import {TableSortLabel} from "@mui/material";
import * as React from "react";
import SimpleCheckbox from "./SimpleCheckbox";


function EnhancedTableHead({headCells, order, orderBy, sortReqHandler, selectAllCheckbox, selectAllHandler, selectAllChecked}) {
    return (
        <TableHead>
            <TableRow key="head">
                {
                    selectAllCheckbox
                        ?
                        <TableCell key="check" sx={{width: '1%'}}>
                            <SimpleCheckbox checked={selectAllChecked}
                                            onChange={(e) => selectAllHandler(e.target.checked)}/>
                        </TableCell>
                        : null
                }
                {
                    headCells.map((hc, i) =>
                        <TableCell
                            key={i}
                            sx={{fontWeight: 'bold', width: hc.width}}
                            sortDirection={orderBy === hc.key ? order : false}
                            align={hc.align || 'left'}>
                            {
                                hc.sortable
                                    ? <TableSortLabel
                                        active={hc.key === orderBy}
                                        direction={hc.key === orderBy ? order : 'asc'}
                                        onClick={() => sortReqHandler(hc.key)}>
                                        {hc.content}
                                    </TableSortLabel>
                                    : hc.content
                            }
                        </TableCell>
                    )
                }
            </TableRow>
        </TableHead>
    )
}

export default EnhancedTableHead;