import Typography from "@mui/material/Typography";

const styles = {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere'
};

export default function TextWrapper({text, sx, ...props}) {
    return <Typography sx={{...styles, ...sx}} {...props}/>;
}