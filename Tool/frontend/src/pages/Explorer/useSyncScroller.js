import {useCallback, useEffect, useRef} from 'react';

const groups = {};

export default function useSyncScroller(key) {
    const nodeRef = useRef(null);

    // key change will unlikely happen?
    useEffect(() => {
        if (groups[key]) {
            groups[key].push(nodeRef);
        } else {
            groups[key] = [nodeRef];
        }
        return () => {
            // detach listener
            if (nodeRef.current) {
                nodeRef.current.onscroll = null;
            }
            // remove self (unsafe)
            groups[key] = groups[key].filter((ref) => ref !== nodeRef);
            if (groups[key].length === 0) {
                delete groups[key];
            }
        };
    }, [key]);

    return useCallback((node) => {
        if (nodeRef.current) {
            if (nodeRef.current !== node) {
                nodeRef.current.onscroll = null;
            }
        }
        if (!node) {
            return;
        }
        nodeRef.current = node;

        const handleScroll = () => {
            const elements = groups[key];

            const scrollX = node.scrollLeft;
            const scrollY = node.scrollTop;

            const updateX = scrollX !== node.eX;
            const updateY = scrollY !== node.eY;

            if (!updateX && !updateY) {
                return;
            }
            node.eX = scrollX;
            node.eY = scrollY;

            for (let elem of elements) {
                let otherEl = elem.current;
                if (otherEl && otherEl !== node) {
                    const listener = otherEl.onscroll;
                    otherEl.onscroll = null;

                    if (updateX) {
                        otherEl.scrollLeft = scrollX;
                    }
                    if (updateY) {
                        otherEl.scrollTop = scrollY;
                    }
                    // runs after all made changes
                    window.requestAnimationFrame(() => {
                        otherEl.onscroll = listener;
                    });
                }
            }
        };
        node.onscroll = () => window.requestAnimationFrame(handleScroll);
    }, [key]);
}