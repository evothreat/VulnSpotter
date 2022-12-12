import Box from "@mui/material/Box";

const styles = {
    width: '990px',
    mr: 'auto',
    ml: 'auto'
};

export default function LayoutBody({sx, ...props}) {
    return <Box sx={{...styles, ...sx}} {...props}/>;
}