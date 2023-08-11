import * as React from "react";
import {useState} from "react";
import Sidebar from "./Sidebar";
import Commits from "./Commits";
import Members from "./Members";
import LayoutBody from "@layout/LayoutBody";
import Settings from "./Settings";


function getView(key, props) {
    switch (key) {
        case 'commits':
            return <Commits {...props}/>;
        case 'members':
            return <Members {...props}/>            // bad approach, pass only children & required parameters
        case 'settings':
            return <Settings {...props}/>
        default:
            return null;
    }
}

export default function Project() {
    const [viewKey, setViewKey] = useState('commits');
    const handleViewChange = viewId => setViewKey(viewId);

    return (
        <LayoutBody>
            <Sidebar viewKey={viewKey} viewChangeHandler={handleViewChange}/>
            {getView(viewKey)}
        </LayoutBody>
    );
}