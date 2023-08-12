import Link from "@mui/material/Link";
import React from "react";


const REF_TYPE = Object.freeze({
    URL: 0,
    ISSUE: 1
});

const HTTPS_URL_REGEX = /https?:\/\/[^\s]+/g;
const ISSUE_REGEX = /#\d+/g;

function extractURLs(text) {
    const parts = [];
    let match;

    while ((match = HTTPS_URL_REGEX.exec(text)) !== null) {
        parts.push({ type: REF_TYPE.URL, value: match[0], offset: match.index });
    }

    return parts;
}

function extractIssues(text) {
    const parts = [];
    let match;

    while ((match = ISSUE_REGEX.exec(text)) !== null) {
        parts.push({ type: REF_TYPE.ISSUE, value: match[0].substring(1), offset: match.index });
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

        if (part.type === REF_TYPE.URL) {
            renderedParts.push(
                <Link href={part.value} key={part.offset} target="_blank" rel="noopener noreferrer">
                    {part.value}
                </Link>
            );
            lastIndex = part.offset + part.value.length;
        }
        else if (part.type === REF_TYPE.ISSUE && issueBaseUrl) {
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