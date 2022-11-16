import {useCallback, useEffect, useRef} from 'react';

const groups = {};

export const useSyncScroller = (id) => {
    const nodeRef = useRef();
    const callbackRef = useRef();

    const detachCurrent = useCallback(() => {
        if (nodeRef.current && callbackRef.current) {
            nodeRef.current.removeEventListener('scroll', callbackRef.current);

            for (const nodeRefs of Object.values(groups)) {
                const ix = nodeRefs.indexOf(nodeRef);
                if (ix !== -1) {
                    nodeRefs.splice(ix, 1);
                    break;
                }
            }
            nodeRef.current = null;
            callbackRef.current = null;
        }
    }, []);

    useEffect(() => detachCurrent, [detachCurrent, id]);

    useEffect(() => {
        detachCurrent();
        if (groups[id]) {
            groups[id].push(nodeRef);
        } else {
            groups[id] = [nodeRef];
        }
    }, [detachCurrent, id]);

    return useCallback((node) => {
        if (!node) {
            return;
        }
        detachCurrent();

        nodeRef.current = node;
        callbackRef.current = () => {
            const elements = groups[id];

            let scrollX = node.scrollLeft;
            let scrollY = node.scrollTop;

            const xRate = scrollX / (node.scrollWidth - node.clientWidth);
            const yRate = scrollY / (node.scrollHeight - node.clientHeight);

            const updateX = scrollX !== node.eX;
            const updateY = scrollY !== node.eY;

            node.eX = scrollX;
            node.eY = scrollY;

            for (let elem of elements) {
                let otherEl = elem.current;
                if (otherEl !== node) {
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
    }, [detachCurrent, id]);
};
