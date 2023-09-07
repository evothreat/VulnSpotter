// NOTE: declaration on backend should be same
const Role = Object.freeze({
    OWNER: 'O',
    CONTRIBUTOR: 'C'
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
    'improper', 'unauthenticated', 'access', 'permission',
    'cross site', 'CSS', 'XSS',
    'denial', 'DOS', 'crash',
    'deadlock',
    'SQL', 'SQLI', 'injection',
    'format string', 'printf', 'scanf',
    'request forgery', 'CSRF', 'XSRF', 'forged',
    'security flaw', 'security bug', 'vulnerability', 'vulnerable', 'hole', 'exploit', 'attack', 'attacker',
    'bypass', 'backdoor', 'threat', 'expose', 'breach', 'violate', 'fatal', 'blacklist', 'overrun', 'insecure',
    'control', 'authentication', 'authorization', 'command',
    'scripting', 'denial of service', 'escalation', 'privilege', 'inclusion', 'configuration', 'config',
    'cryptography',
    'memory', 'leak', 'corruption', 'traversal', 'redirect', 'replay',
    'unvalidated', 'zero-day', 'CVE', 'TLS', 'SSL', 'auth', 'cert', 'certificate', 'risk', 'password'
];

export {
    Role,
    FILE_EXTENSIONS,
    VULN_KEYWORDS
};