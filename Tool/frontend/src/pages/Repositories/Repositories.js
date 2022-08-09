import {Fragment, useState} from "react";
import Header from "../../layout/Header";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import AddIcon from '@mui/icons-material/Add';
import Button from "@mui/material/Button";
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import BasicTable from "./Table";


export function Repositories() {
    const [currentTab, setCurrentTab] = useState('1');

    const handleTabChange = (event, val) => {
        setCurrentTab(val);
    };

    const [repos, setRepos] = useState([]);

    return (
        <Fragment>
            <Header/>
            <Box sx={{mr: '20%', ml: '20%'}}>
                <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        mt: 6
                    }}
                >
                    <Typography variant="h5">
                        Repositories
                    </Typography>
                    <Button variant="contained" startIcon={<AddIcon/>}>
                        New
                    </Button>
                </Box>

                <Box sx={{ mt: '25px', typography: 'body1' }}>
                    <TabContext value={currentTab}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <TabList onChange={handleTabChange}>
                                <Tab label={`All (${repos.length})`} value="1" />
                                <Tab label={`Personal (${repos.filter(r => r.personal).length})`} value="2" />
                                <Tab label={`Favorites (${repos.filter(r => r.favorite).length})`} value="3" />
                            </TabList>
                        </Box>
                        <TabPanel sx={{pr: 0, pl: 0}} value="1">Item One</TabPanel>
                        <TabPanel sx={{pr: 0, pl: 0}} value="2">Item Two</TabPanel>
                        <TabPanel sx={{pr: 0, pl: 0}} value="3">Item Three</TabPanel>
                    </TabContext>
                </Box>
            </Box>
        </Fragment>
    )
}