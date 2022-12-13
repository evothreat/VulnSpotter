
const Role = Object.freeze({
    OWNER: 'owner',
    CONTRIBUTOR: 'contributor'
});


const FILE_EXTENSIONS = [
    'c',
    'cpp',
    'java',
    'php',
    'py',
    'ruby',
    'js',
    'go',
    's',
    'asm'
];

const VULN_KEYWORDS = [
    'race', 'racy',
    'buffer', 'overflow', 'stack',
    'integer', 'signedness', 'widthness', 'underflow',
    'improper', 'unauthenticated', 'gain access', 'permission',
    'cross site', 'CSS', 'XSS', 'htmlspecialchar',
    'denial service', 'DOS', 'crash',
    'deadlock',
    'SQL', 'SQLI', 'injection',
    'format', 'string', 'printf', 'scanf',
    'request forgery', 'CSRF', 'XSRF', 'forged',
    'security', 'vulnerability', 'vulnerable', 'hole', 'exploit', 'attack', 'bypass', 'backdoor',
    'threat', 'expose', 'breach', 'violate', 'fatal', 'blacklist', 'overrun', 'insecure'
];

export {
    Role,
    FILE_EXTENSIONS,
    VULN_KEYWORDS
};