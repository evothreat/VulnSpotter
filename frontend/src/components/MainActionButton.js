import Button from "@mui/material/Button";

const styles = {
    fontSize: '14px',
    '& .MuiButton-startIcon': {marginRight: '5px'}
};

export default function MainActionButton({sx, ...props}) {
    return (
        <Button size="small" variant="contained" sx={{...styles, ...sx}} {...props}/>
    );
}