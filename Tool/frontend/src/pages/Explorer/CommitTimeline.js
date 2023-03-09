import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import Typography from "@mui/material/Typography";
import {Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import Button from "@mui/material/Button";
import {TimelineOppositeContent} from "@mui/lab";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Box from "@mui/material/Box";


function hasNonEmptyLine(lines, ix=0) {
    const lineN = lines.length - ix;
    while (lineN > ix) {
        if (!/\S/.test(lines[ix++])) {
            return true;
        }
    }
    return false;
}

function CommitTimelineItem({author, date, message, dotStyle}) {
    const [expanded, setExpanded] = useState(false);

    const messageLines = message.split('\n');
    const hasMoreText = messageLines.length > 1 && hasNonEmptyLine(messageLines, 1);

    return (
        <TimelineItem>
            <TimelineOppositeContent sx={{flex: 0.32}}>
                <Typography>{author}</Typography>
                <Typography>{new Date(date * 1000).toLocaleString()}</Typography>
            </TimelineOppositeContent>
            <TimelineSeparator>
                <TimelineDot sx={dotStyle}/>
                <TimelineConnector/>
            </TimelineSeparator>
            <TimelineContent>
                <pre style={{margin: 0, padding: 0}}>
                    <Typography>
                    {
                        expanded
                            ? message
                            : messageLines[0]
                    }
                    </Typography>
                </pre>
                {
                    hasMoreText && (
                        <IconButton
                            onClick={() => setExpanded(!expanded)}
                            size="small"
                            sx={{mt: 1, color: '#bdbdbd'}}
                        >
                            {
                                expanded
                                    ? <ExpandLessIcon/>
                                    : <ExpandMoreIcon/>
                            }
                        </IconButton>
                    )
                }
            </TimelineContent>
        </TimelineItem>
    );
}


function CommitTimeline({data}) {
    return (
        <Timeline align="alternate">
            <CommitTimelineItem author={data.commit.author} date={data.commit.authored_date}
                                message={data.commit.message} dotStyle={{background: '#00bf00'}}/>
            {
                data.parents.map((parent) => (
                    <CommitTimelineItem key={parent.hash} author={parent.author} date={parent.authored_date}
                                        message={parent.message}/>
                ))
            }
        </Timeline>
    );
}


function CommitTimelineDialog({data, closeHandler, loadMoreHandler}) {
    const contentRef = useRef(null);

    useEffect(() => {
        setTimeout(() => {
            contentRef.current.focus();
        }, 0);
    }, []);

    return (
        <Dialog open={true} onClose={closeHandler} maxWidth="md" fullWidth>
            <DialogTitle sx={{p: '12px 24px'}}>History</DialogTitle>
            <DialogContent dividers ref={contentRef} tabIndex="1" sx={{overflowX: 'hidden', p: '0 20px 0 0'}}>
                <CommitTimeline data={data}/>
                <Box sx={{textAlign: 'center'}}>
                    <Button onClick={loadMoreHandler}>Load more</Button>
                </Box>
            </DialogContent>
            <DialogActions disableSpacing>
                <Button onClick={closeHandler} color="primary">Close</Button>
            </DialogActions>
        </Dialog>
    );
}

export default CommitTimelineDialog;