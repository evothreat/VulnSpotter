import {useEffect, useRef} from "react";
import * as Mousetrap from "mousetrap"

const useHotkeys = (sequence, callback, eventType) => {
    const actionRef = useRef(null);
    actionRef.current = callback;

    useEffect(() => {
        if (!sequence) {
            return;
        }

        Mousetrap.bind(sequence, (e, combo) => {
            typeof actionRef.current === 'function' && actionRef.current(e, combo);
        }, eventType);

        return () => {
            if (Array.isArray(sequence)) {
                for (const key of sequence) {
                    Mousetrap.unbind(key);
                }
            } else {
                Mousetrap.unbind(sequence);
            }
        };
    }, [eventType, sequence]);
};

export default useHotkeys;