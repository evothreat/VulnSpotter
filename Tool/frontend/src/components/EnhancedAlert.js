import {Alert, Snackbar} from "@mui/material";


const FakeComponent = ({children}) => children;

export default function EnhancedAlert({msg, severity, closeHandler}) {
    return (
        <Snackbar open autoHideDuration={5000} onClose={closeHandler}
                  TransitionComponent={FakeComponent}>
            <Alert onClose={closeHandler} severity={severity || "info"}>
                {msg}
            </Alert>
        </Snackbar>
    );
}