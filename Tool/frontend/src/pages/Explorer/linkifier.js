import Link from "@mui/material/Link";
import React from "react";


const REF_TYPE = Object.freeze({
    URL: 0,
    ISSUE: 1
});

const HTTPS_URL_REGEX = /https?:\/\/[^\s]+/g;
const ISSUE_REGEX = /#\d+/g;

function extractRefs(text, refRegex, refType) {
    const parts = [];
    let match;

    while ((match = refRegex.exec(text)) !== null) {
        parts.push({ type: refType, value: match[0], offset: match.index });
    }

    return parts;
}

function linkify(text, issueBaseUrl) {
    const urls = extractRefs(text, HTTPS_URL_REGEX, REF_TYPE.URL);
    const issues = extractRefs(text, ISSUE_REGEX, REF_TYPE.ISSUE);

    // Combine and sort by offset
    const combinedParts = urls.concat(issues).sort((a, b) => a.offset - b.offset);

    // Render parts
    let lastIndex = 0;
    const renderedParts = [];

    combinedParts.forEach(part => {
        if (lastIndex !== part.offset) {
            renderedParts.push(text.substring(lastIndex, part.offset));
        }
        const {type, value, offset} = part;
        const href = type === REF_TYPE.URL ? value : `${issueBaseUrl}${value.substring(1)}`;

        renderedParts.push(
            <Link href={href} key={offset} target="_blank" rel="noopener noreferrer">
                {value}
            </Link>
        );
        lastIndex = offset + value.length;
    });

    if (lastIndex !== text.length) {
        renderedParts.push(text.substring(lastIndex));
    }

    return <>{renderedParts}</>;
}

export default linkify;