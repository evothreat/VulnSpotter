# VulnSpotter

A comprehensive tool designed to identify and analyze commits that address security vulnerabilities in open-source repositories.

## Features

- **Vulnerability Parsing**: 
  - Scans the repository for potentially vulnerable commits using `git-vuln-finder` and categorizes them into projects for further review.
  
- **Clear Display of Results**: 
  - The tool presents identified commits in an easy-to-digest manner, detailing:
    - Referenced CVE entries
    - Commit messages
    - Commit changes with syntax highlighting

- **Display Modes**: 
  - View commit changes in two distinct styles:
    - **Unified Mode**: A single diff view with changes.
    - **Split Mode**: Side-by-side comparison of old and new code.

- **Filtering Capabilities**: 
  - Filter commits using specific keywords to narrow down your review process.

- **Review Mechanism**: 
  - Classify commits into various categories:
    - Vulnerable
    - Neutral
    - Safe

- **Export Functionality**: 
  - Export metadata about your reviewed commits for record-keeping or further analysis.

- **Collaborative Review**: 
  - Invite other team members to your project, allowing them to review and classify commits.


## License

[MIT License](LICENSE) - Use, modify, and distribute as you deem fit.
