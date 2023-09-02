import Box from "@mui/material/Box";

const styles = {
    mr: '17%',
    ml: '17%'
};

export default function LayoutBody({sx, ...props}) {
    return <Box sx={{...styles, ...sx}} {...props}/>;
}