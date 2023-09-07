import {Alert, Snackbar} from "@mui/material";


const FakeComponent = ({children}) => children;

export default function TemporaryAlert({severity, closeHandler, children}) {
    return (
        <Snackbar open autoHideDuration={3500} onClose={closeHandler}
                  TransitionComponent={FakeComponent}>
            <Alert onClose={closeHandler} severity={severity || "info"}>
                {children}
            </Alert>
        </Snackbar>
    );
}