import {useEffect, useRef} from "react";
import * as Mousetrap from "mousetrap"

const useHotkeys = (sequence, callback, eventType) => {
    const actionRef = useRef(null);
    actionRef.current = callback;

    useEffect(() => {
        Mousetrap.bind(sequence, (e, combo) => {
            typeof actionRef.current === 'function' && actionRef.current(e, combo);
        }, eventType);
        return () => {
            Mousetrap.unbind(sequence);
        };
    }, []);     // if sequence or eventType is dynamic -> add dependencies
};

export default useHotkeys;