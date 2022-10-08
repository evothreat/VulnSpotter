import {useParams} from "react-router-dom";


export default function Commits() {

    const {projId} = useParams();

    return <p>Hello {projId}!</p>;
}