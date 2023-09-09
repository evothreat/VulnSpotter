function VerticalExpandMoreIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" {...props}>
            <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
        </svg>
    );
}

function VerticalExpandLessIcon(props) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" {...props}>
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
        </svg>
    );
}

export {
    VerticalExpandMoreIcon,
    VerticalExpandLessIcon
}