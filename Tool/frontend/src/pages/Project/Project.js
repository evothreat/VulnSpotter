import * as React from "react";
import {useEffect, useState} from "react";
import {Sidebar, VIEW_TYPE, USER_ROLE} from "./Sidebar";
import Commits from "./Commits";
import Members from "./Members";
import LayoutBody from "@layout/LayoutBody";
import Settings from "./Settings";
import {useSearchParams} from "react-router-dom";
import {useProject} from "./useProject";
import TokenService from "@services/TokenService";


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
    const [project,] = useProject();
    const [searchParams, setSearchParams] = useSearchParams();
    const [viewKey, setViewKey] = useState(null);

    useEffect(() => {
        const viewId = searchParams.get('view');
        if (viewId) {
            setViewKey(viewId);
        }
        else {
            setViewKey(VIEW_TYPE.COMMITS);  // default view
        }
    }, [searchParams]);

    const handleViewChange = viewId => {
        setSearchParams({view: viewId});
    };

    return (
        <LayoutBody>
            <Sidebar viewKey={viewKey} viewChangeHandler={handleViewChange}
                     curUserRole={project.owner.id === TokenService.getUserId() ? USER_ROLE.OWNER : USER_ROLE.MEMBER}
            />
            {getView(viewKey)}
        </LayoutBody>
    );
}