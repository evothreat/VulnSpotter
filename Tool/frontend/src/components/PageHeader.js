import Box from "@mui/material/Box";

const styles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    mt: '45px',
    mb: '30px'
};

export default function PageHeader({sx, ...props}) {
    return (
        <Box sx={{...styles, ...sx}} {...props}/>
    );
}