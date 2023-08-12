import Link from "@mui/material/Link";
import React from "react";


function extractURLs(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const parts = [];
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
        parts.push({ type: 'url', value: match[0], offset: match.index });
    }

    return parts;
}

function extractIssues(text) {
    const issueRegex = /#\d+/g;
    const parts = [];
    let match;

    while ((match = issueRegex.exec(text)) !== null) {
        parts.push({ type: 'issue', value: match[0].substring(1), offset: match.index });
    }

    return parts;
}

function linkify(text, issueBaseUrl) {
    const urls = extractURLs(text);
    const issues = extractIssues(text);

    // Combine and sort by offset
    const combinedParts = urls.concat(issues).sort((a, b) => a.offset - b.offset);

    // Render parts
    let lastIndex = 0;
    const renderedParts = [];

    combinedParts.forEach(part => {
        if (lastIndex !== part.offset) {
            renderedParts.push(text.substring(lastIndex, part.offset));
        }

        if (part.type === 'url') {
            renderedParts.push(
                <Link href={part.value} key={part.offset} target="_blank" rel="noopener noreferrer">
                    {part.value}
                </Link>
            );
            lastIndex = part.offset + part.value.length;
        } else if (part.type === 'issue' && issueBaseUrl) {
            renderedParts.push(
                <Link href={`${issueBaseUrl}${part.value}`} key={part.offset} target="_blank" rel="noopener noreferrer">
                    {`#${part.value}`}
                </Link>
            );
            lastIndex = part.offset + part.value.length + 1; // Account for the # character
        }
    });

    if (lastIndex !== text.length) {
        renderedParts.push(text.substring(lastIndex));
    }

    return <>{renderedParts}</>;
}

export default linkify;