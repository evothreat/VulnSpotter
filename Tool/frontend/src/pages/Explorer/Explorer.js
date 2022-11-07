import Box from "@mui/material/Box";
import DiffViewer from "./DiffViewer";
import React, {Fragment, useEffect, useRef, useState} from "react";
import ProjectsService from "../../services/ProjectsService";
import {useParams} from "react-router-dom";
import * as Utils from "../../utils";
import CommitsService from "../../services/CommitsService";
import {parsePatch} from "../../diffUtils";
import Typography from "@mui/material/Typography";
import {capitalize, mod} from "../../utils";
import CircleIcon from '@mui/icons-material/Circle';
import IconButton from "@mui/material/IconButton";
import * as Mousetrap from "mousetrap"


// TODO: load only specific commits

const severityColor = {
    low: '#bfbfbf',
    medium: '#f9b602',
    high: '#f68831',
    critical: '#e73025'
}

function cur(obj) {
    return obj.data[obj.ix];
}

function renderDetail(title, content) {
    return (
        <Box>
            <Typography sx={{fontWeight: 'bold', fontSize: '15px', mb: '4px'}}>
                {title}
            </Typography>
            <Typography sx={{fontSize: '14px'}}>
                {content}
            </Typography>
        </Box>
    );
}

// convert to function 'renderCveDetails'? Are components from functions recreated?
function CVEDetails({cve}) {
    return (
        <Fragment>
            <Box display="flex" justifyContent="space-between" alignItems="center" padding="16px 25px"
                 backgroundColor="#eaf0f7" borderBottom="1px solid #ccc">
                <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                    {cve.id}
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center" padding="5px 12px" borderRadius="15px"
                     style={{backgroundColor: severityColor[cve.severity]}}>
                    <Typography fontSize="small" color="white">
                        {capitalize(cve.severity)}
                    </Typography>
                </Box>
            </Box>
            <Box display="flex" flexDirection="column" gap="13px" padding="16px 25px">
                {renderDetail('Summary', cve.summary)}
                {renderDetail('Description', cve.description)}
            </Box>
        </Fragment>
    );
}

function CVEList({cveList, style}) {
    const [cveIx, setCveIx] = useState(0);

    const handleChange = (e) => {
        setCveIx(parseInt(e.currentTarget.dataset.index));
    };

    const bindHotkeys = () => {
        Mousetrap.bind(['left', 'right'], (e, key) => {
            e.preventDefault();
            const dir = key === 'right' ? 1 : -1;
            setCveIx((curIx) => mod((curIx + dir), cveList.length));
        });
    };

    const unbindHotkeys = () => {
        Mousetrap.unbind('left');
        Mousetrap.unbind('right');
    };

    return (
        <Box tabIndex="0" onFocus={bindHotkeys} onBlur={unbindHotkeys}
             height="100%" width="100%" overflow="auto" border="solid #ccc" sx={{borderWidth: '0 1px 1px 0'}}
             style={style}>
            {
                <CVEDetails cve={cveList[cveIx]}/>
            }
            <Box display="flex" justifyContent="center" position="sticky" bottom="0" zIndex="1" bgcolor="white"
                 height="24px">
                {
                    cveList.map((_, i) => (
                        <IconButton key={i} disableRipple sx={{padding: '2px 3px'}} onClick={handleChange}
                                    data-index={i}>
                            <CircleIcon sx={{fontSize: '10px'}} style={{color: i === cveIx ? '#71757e' : '#bbb4b4'}}/>
                        </IconButton>
                    ))
                }
            </Box>
        </Box>
    );
}

export default function Explorer() {
    const {projId} = useParams();

    const [commits, setCommits] = useState(null);
    const [diffs, setDiffs] = useState(null);
    const reverse = useRef(false);

    const cveList = [
        {
            id: 'CVE-2019-3822',
            severity: 'medium',   // or score
            summary: 'Requirement to use TLS not properly enforced for IMAP, POP3, and FTP protocols',
            description: 'A user can tell curl >= 7.20.0 and <= 7.78.0 to require a successful upgrade to TLS when speaking to an IMAP, POP3 or FTP server (`--ssl-reqd` on the command line or`CURLOPT_USE_SSL` set to `CURLUSESSL_CONTROL` or `CURLUSESSL_ALL` withlibcurl). This requirement could be bypassed if the server would return a properly crafted but perfectly legitimate response.This flaw would then make curl silently continue its operations **withoutTLS** contrary to the instructions and expectations, exposing possibly sensitive data in clear text over the network.'
        },
        {
            id: 'CVE-2019-3822',
            severity: 'high',   // or score
            summary: 'Requirement to use TLS not properly enforced for IMAP, POP3, and FTP protocols',
            description: 'A user can tell curl >= 7.20.0 and <= 7.78.0 to require a successful upgrade to TLS when speaking to an IMAP, POP3 or FTP server (`--ssl-reqd` on the command line or`CURLOPT_USE_SSL` set to `CURLUSESSL_CONTROL` or `CURLUSESSL_ALL` withlibcurl). This requirement could be bypassed if the server would return a properly crafted but perfectly legitimate response.This flaw would then make curl silently continue its operations **withoutTLS** contrary to the instructions and expectations, exposing possibly sensitive data in clear text over the network.'
        }
    ];

    useEffect(() => {
        ProjectsService.getUnratedCommits(projId)
            .then((data) => {
                data.forEach((c) => {
                    c.cve = Utils.findCVEs(c.message);
                });
                setCommits({
                    data: data,
                    ix: 0
                });
            });
    }, [projId]);

    useEffect(() => {
        commits && CommitsService.getPatch(cur(commits).id)
            .then((data) => {
                const newDiffs = {
                    data: parsePatch(data),
                    ix: 0
                };
                if (reverse.current) {
                    reverse.current = false;
                    newDiffs.ix = newDiffs.data.length - 1;
                }
                setDiffs(newDiffs);
            });
    }, [commits]);

    useEffect(() => {
        Mousetrap.bind('shift+left', (e) => {
            e.preventDefault();
            if (diffs.ix - 1 >= 0) {
                diffs.ix--;
                setDiffs({...diffs});
            } else if (commits.ix - 1 >= 0) {
                reverse.current = true;
                commits.ix--;
                setCommits({...commits});
            } else {
                console.log('no more commits available')
            }
        });
        Mousetrap.bind('shift+right', (e) => {
            e.preventDefault();
            if (diffs.data.length > diffs.ix + 1) {
                diffs.ix++;
                setDiffs({...diffs});
            } else if (commits.data.length > commits.ix + 1) {
                commits.ix++;
                setCommits({...commits});
            } else {
                console.log('no more commits available')
            }
        });
    }, [diffs, commits]);

    useEffect(() => () => {
        Mousetrap.unbind('shift+left');
        Mousetrap.unbind('shift+right');
    }, []);

    return (
        <Box display="flex" height="90vh" gap="2px">

            <Box display="flex" flexDirection="column" height="100%" width="30%">
                <CVEList cveList={cveList} style={{height: '50%'}}/>

                <Box height="50%">
                    fefwf
                </Box>
            </Box>
            {
                // recreate DiffViewer when diffs changes?
                diffs && <DiffViewer codeLines={cur(diffs).lines} fileName={cur(diffs).oldFileName}
                                     style={{minWidth: '70%', width: '70%'}}/>
            }
        </Box>
    );
}