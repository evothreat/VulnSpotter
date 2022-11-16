import React, {useState} from "react";
import * as Mousetrap from "mousetrap";
import {mod} from "../../utils";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircleIcon from "@mui/icons-material/Circle";
import WindowTitle from "./WindowTitle";


const severityColor = {
    None: '#eeeeee',
    Low: '#bfbfbf',
    Medium: '#f9b602',
    High: '#f78931',
    Critical: '#e73025'
}


function renderDetail(title, content, vertical, style) {
    return (
        <Box display="flex" gap={vertical ? '4px' : '8px'} flexDirection={vertical ? 'column' : 'row'}>
            <Typography fontWeight="bold" fontSize="14px">
                {title}
            </Typography>
            <Typography fontSize="14px" sx={style}>
                {content}
            </Typography>
        </Box>
    );
}

function renderDetails(cve) {
    return (
        <Box flex="1 1 0" overflow="auto" display="flex" flexDirection="column" gap="12px" padding="10px 16px">
            {renderDetail('Name:', cve.cve_id)}
            {
                renderDetail('Severity:', `${cve.cvss_score} ${cve.severity}`, false,
                    {
                        padding: '2px 6px', fontSize: '12px',
                        textTransform: 'uppercase', bgcolor: severityColor[cve.severity]
                    }
                )
            }
            {renderDetail('Summary:', cve.summary || 'N/A')}
            {renderDetail('Description:', cve.description, true)}
        </Box>
    );
}

export default function CveViewer({cveList}) {
    const [cveIx, setCveIx] = useState(0);

    const handleChange = (e) => {
        setCveIx(parseInt(e.currentTarget.dataset.index));
    };

    const bindHotkeys = () => {
        Mousetrap.bind(['left', 'right'], (e, key) => {
            e.preventDefault();
            setCveIx((curIx) => mod((curIx + (key === 'right' ? 1 : -1)), cveList.length));
        });
    };

    const unbindHotkeys = () => {
        Mousetrap.unbind('left');
        Mousetrap.unbind('right');
    };

    return (
        <Box tabIndex="-1" flex="1 1 0" display="flex" flexDirection="column" onFocus={bindHotkeys} onBlur={unbindHotkeys}>
            <WindowTitle title="CVEs"/>
            {renderDetails(cveList[cveIx])}
            {
                cveList.length > 1 && (
                    <Box display="flex" justifyContent="center" position="sticky" bottom="0" zIndex="1" bgcolor="white">
                        {
                            cveList.map((_, i) => (
                                <IconButton key={i} disableRipple sx={{padding: '8px 3px'}} onClick={handleChange} data-index={i}>
                                    <CircleIcon sx={{fontSize: '10px'}} style={{color: i === cveIx ? '#71757e' : '#bbb4b4'}}/>
                                </IconButton>
                            ))
                        }
                    </Box>
                )
            }
        </Box>
    );
}