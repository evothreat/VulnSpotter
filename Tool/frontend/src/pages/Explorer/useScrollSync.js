import {useCallback, useEffect, useRef} from 'react';


const groups = {};

export const useSyncScroller = (key) => {
    const nodeRef = useRef();
    const callbackRef = useRef();

    const cleanup = useCallback(() => {
        // detach listener
        if (nodeRef.current && callbackRef.current) {
            nodeRef.current.removeEventListener('scroll', callbackRef.current);
        }
        // remove ref from groups (nodeRef and not nodeRef.current)
        for (const [key, nodeRefs] of Object.entries(groups)) {
            const ix = nodeRefs.indexOf(nodeRef);
            if (ix !== -1) {
                if (nodeRefs.length > 1) {
                    nodeRefs.splice(ix, 1);
                } else {
                    delete groups[key];
                }
                break;
            }
        }
        // clear references
        nodeRef.current = null;
        callbackRef.current = null;
    }, []);

    useEffect(() => {
        if (groups[key]) {
            groups[key].push(nodeRef);
        } else {
            groups[key] = [nodeRef];
        }
        return cleanup;
    }, [cleanup, key]);

    return useCallback((node) => {
        if (!node) {
            return;
        }
        if (nodeRef.current) {
            if (nodeRef.current !== node) {
                // reassign to new node
                nodeRef.current.removeEventListener('scroll', callbackRef.current);
                nodeRef.current = node;
                node.addEventListener('scroll', callbackRef.current);
            }
            return;
        }
        nodeRef.current = node;
        callbackRef.current = () => {
            const curEl = nodeRef.current;
            const elements = groups[key];

            let scrollX = curEl.scrollLeft;
            let scrollY = curEl.scrollTop;

            const xRate = scrollX / (curEl.scrollWidth - curEl.clientWidth);
            const yRate = scrollY / (curEl.scrollHeight - curEl.clientHeight);

            const updateX = scrollX !== curEl.eX;
            const updateY = scrollY !== curEl.eY;

            curEl.eX = scrollX;
            curEl.eY = scrollY;

            for (let elem of elements) {
                let otherEl = elem.current;
                // we do only synchronize others
                if (otherEl !== curEl) {
                    if (
                        updateX &&
                        Math.round(
                            otherEl.scrollLeft -
                            (scrollX = otherEl.eX = Math.round(
                                xRate * (otherEl.scrollWidth - otherEl.clientWidth)
                            ))
                        )
                    ) {
                        otherEl.scrollLeft = scrollX;
                    }
                    if (
                        updateY &&
                        Math.round(
                            otherEl.scrollTop -
                            (scrollY = otherEl.eY = Math.round(
                                yRate * (otherEl.scrollHeight - otherEl.clientHeight)
                            ))
                        )
                    ) {
                        otherEl.scrollTop = scrollY;
                    }
                }
            }
        };
        node.addEventListener('scroll', callbackRef.current);
    }, [key]);
};
