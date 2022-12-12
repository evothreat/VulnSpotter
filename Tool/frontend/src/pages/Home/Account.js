import PageHeader from "../../components/PageHeader";
import Typography from "@mui/material/Typography";
import * as React from "react";
import LayoutBody from "../../layout/LayoutBody";
import {Stack} from "@mui/material";
import MainActionButton from "../../components/MainActionButton";
import FormTextField from "../../components/FormTextField";
import {useEffect, useState} from "react";
import AuthService from "../../services/AuthService";
import {isObjEmpty, isValidEmail} from "../../utils";
import EnhancedAlert from "../../components/EnhancedAlert";


export default function Account() {

    const [alertMsg, setAlertMsg] = useState('');
    const [currUser, setCurrUser] = useState(null);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');

    const [inputErrors, setInputErrors] = useState({});

    useEffect(() => {
        AuthService.getCurrentUser().then((data) => {
            setCurrUser(data);
            setFullName(data.full_name);
            setEmail(data.email);
        });
    }, []);

    const validateInput = () => {
        const errors = {};
        if (!fullName) {
            errors.fullName = true;
        }
        if (!email || !isValidEmail(email)) {
            errors.email = true;
        }
        if (password1) {
            if (5 > password1.length) {
                errors.password1 = true;
            }
            if (password1 !== password2) {
                errors.password2 = true;
            }
        }
        return errors;
    };

    const getUpdatedFields = () => {
        const fields = {};
        if (fullName !== currUser.full_name) {
            fields.full_name = fullName;
        }
        if (email !== currUser.email) {
            fields.email = email;
        }
        if (password1) {
            fields.password = password1;
        }
        return fields;
    };

    const handleSubmit = () => {
        const errors = validateInput();
        if (!isObjEmpty(errors)) {
            setInputErrors(errors);
            return;
        }

        const fields = getUpdatedFields();
        if (!isObjEmpty(fields)) {
            AuthService.updateCurrentUser(fields)
                .then(() => {
                    if (!isObjEmpty(inputErrors)) {
                        setInputErrors({});
                    }
                    setAlertMsg('User information successfully updated.')
                });
        }
    };

    return currUser && (
        <LayoutBody>
            <PageHeader>
                <Typography variant="h6">
                    Account
                </Typography>
            </PageHeader>
            <Stack width="300px" gap="30px">
                <Stack gap="8px">
                    <FormTextField required label="Full name" name="fullName"
                                   value={fullName} onChange={(e) => setFullName(e.target.value)}
                                   error={inputErrors.fullName}/>

                    <FormTextField required disabled label="Username" value={currUser.username}/>

                    <FormTextField required label="E-Mail" name="email"
                                   value={email} onChange={(e) => setEmail(e.target.value)}
                                   error={inputErrors.email}/>
                </Stack>

                <Stack gap="8px">
                    <FormTextField type="password" label="Password (min. 4 characters)" name="password1"
                                   value={password1} onChange={(e) => setPassword1(e.target.value)}
                                   error={inputErrors.password1}/>
                    <FormTextField type="password" label="Confirm password" name="password2"
                                   value={password2} onChange={(e) => setPassword2(e.target.value)}
                                   error={inputErrors.password2}/>
                </Stack>

                <Stack direction="row" gap="8px">
                    <MainActionButton type="submit" onClick={handleSubmit}>
                        Save
                    </MainActionButton>
                    <MainActionButton variant="outlined">
                        Cancel
                    </MainActionButton>
                </Stack>
            </Stack>
            {
                alertMsg && <EnhancedAlert msg={alertMsg} severity="success" closeHandler={() => setAlertMsg('')}/>
            }
        </LayoutBody>
    );
}