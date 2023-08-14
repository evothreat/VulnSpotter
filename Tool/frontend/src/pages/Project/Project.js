import * as React from "react";
import {useState} from "react";
import {Sidebar, VIEW_TYPE} from "./Sidebar";
import Commits from "./Commits";
import Members from "./Members";
import LayoutBody from "@layout/LayoutBody";
import Settings from "./Settings";


function getView(key, props) {
    switch (key) {
        case VIEW_TYPE.COMMITS:
            return <Commits {...props}/>;
        case VIEW_TYPE.MEMBERS:
            return <Members {...props}/>            // bad approach, pass only children & required parameters
        case VIEW_TYPE.SETTINGS:
            return <Settings {...props}/>
        default:
            return null;
    }
}

export default function Project() {
    const [viewKey, setViewKey] = useState(VIEW_TYPE.COMMITS);
    const handleViewChange = viewId => setViewKey(viewId);

    return (
        <LayoutBody>
            <Sidebar viewKey={viewKey} viewChangeHandler={handleViewChange}/>
            {getView(viewKey)}
        </LayoutBody>
    );
}