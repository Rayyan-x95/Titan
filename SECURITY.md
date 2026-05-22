# Security Policy

## Supported Versions

Titan is currently in active development (Beta). We support the following versions for security updates:

| Version | Supported          |
| ------- | ------------------ |
| v0.1.x  | :white_check_mark: |
| < v0.1  | :x:                |

## Security Model

Titan is a **100% local-first** application — your data never leaves your device. Our security model focuses on protecting local data and preventing client-side attacks.

### Security Features

- **Zero Network Transmission**: All data stored in IndexedDB via Dexie. No external API calls, no telemetry, no cloud sync.
- **Content Security Policy (CSP)**: Strict CSP enforced to prevent XSS and unauthorized script execution.
- **Advanced PIN Protection**: App PINs are hashed using **PBKDF2-HMAC-SHA256** with **100,000 iterations**, providing strong protection against local brute-force attacks.
- **Optional Biometric Unlock**: WebAuthn-based biometric authentication (Touch ID, Face ID) as an alternative to PIN entry.
- **Robust Input Sanitization**: All user inputs are sanitized using browser-native DOM parsing to strip HTML/XSS payloads. String lengths are truncated at the boundary. Tags use Unicode-aware sanitization.
- **Atomic Transactions**: Multi-table database operations use Dexie transactions to prevent data corruption from partial writes.
- **Privacy-First Diagnostics**: System logs and metrics are stored in RAM/IndexedDB and are never transmitted to external servers.
- **Error Isolation**: Error boundaries catch component failures and offer local-only diagnostics export.

### Input Validation

All store actions enforce validation at the boundary:

| Input Type   | Sanitization                                                        |
| ------------ | ------------------------------------------------------------------- |
| Strings      | Trimmed, length-capped (`sanitizeString`)                           |
| HTML content | DOM-parsed, tags stripped (`stripHtml`)                             |
| Tags         | Lowercased, Unicode-aware alphanumeric only (`sanitizeTag`)         |
| Dates        | ISO format validated, invalid dates rejected (`sanitizeDateString`) |
| Money        | Integer cents enforced, `normalizeCents()` applied                  |
| References   | Foreign key existence validated before write                        |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public issue**. Instead, follow these steps:

1. Email your findings to **mmohammedrayyan0808@gmail.com** (or open a private advisory via GitHub Security Advisories).
2. Provide a detailed description of the vulnerability and steps to reproduce it.
3. We will acknowledge your report within 48 hours and provide a timeline for a fix.

## Our Commitment

- We will not disclose your identity without your permission.
- We will work with you to understand and resolve the issue.
- We will give you credit for the discovery in our release notes (if desired).

Thank you for helping keep Titan secure!
