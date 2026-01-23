---
title: "Security Best Practices"
description: "Security guidelines for ObjectUI applications"
---

# Security Best Practices

ObjectUI is designed with security in mind. This guide helps you build secure applications using ObjectUI.

## Overview

When building applications with ObjectUI, security considerations span multiple areas:
- Input validation and sanitization
- Authentication and authorization
- Data handling
- API security
- Expression evaluation
- Content Security Policy (CSP)

## Input Validation

### Schema Validation

Always validate schemas before rendering:

```typescript
import { validateSchema } from '@object-ui/core';

// Validate schemas from untrusted sources
const result = validateSchema(schema);
if (!result.valid) {
  console.error('Invalid schema:', result.errors);
  // Don't render invalid schemas
  return <ErrorPage />;
}
```

### User Input Sanitization

ObjectUI automatically sanitizes user input in form fields, but additional measures may be needed:

```typescript
// For custom components, sanitize HTML
import DOMPurify from 'dompurify';

function CustomComponent({ userContent }: Props) {
  const clean = DOMPurify.sanitize(userContent);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

### Expression Safety

ObjectUI's expression system is designed to be safe, but follow these practices:

**✅ DO:**
```json
{
  "visibleOn": "${data.role === 'admin'}",
  "value": "${data.user.name}"
}
```

**❌ DON'T:**
```json
{
  // Never execute arbitrary code from user input
  "value": "${eval(data.userProvidedCode)}"
}
```

## Authentication & Authorization

### Role-Based Access Control

Use expressions for visibility control:

```json
{
  "type": "page",
  "body": {
    "type": "button",
    "label": "Admin Panel",
    "visibleOn": "${data.user.role === 'admin'}"
  }
}
```

### Token Management

**Secure token storage:**

```typescript
// ✅ Good: Use httpOnly cookies (server-side)
// Set tokens in httpOnly cookies from your backend

// ⚠️ Caution: If using localStorage/sessionStorage
// Never store sensitive tokens in localStorage for XSS-prone apps
const token = sessionStorage.getItem('authToken');
```

### DataSource Security

Implement authentication in your DataSource:

```typescript
import type { DataSource } from '@object-ui/types';

class SecureDataSource implements DataSource {
  private getAuthHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json',
    };
  }

  async find(resource: string, params?: any) {
    const response = await fetch(`/api/${resource}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include', // Include cookies
    });

    if (response.status === 401) {
      // Handle unauthorized access
      this.handleUnauthorized();
    }

    return response.json();
  }

  private handleUnauthorized() {
    // Redirect to login or refresh token
    window.location.href = '/login';
  }
}
```

### Server-Side Schema Validation

**Never trust client-side validation alone.** Always validate on the server:

```typescript
// Backend validation example
app.post('/api/users', async (req, res) => {
  // Validate user has permission
  if (!req.user.canCreateUser) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Validate input
  const validationResult = validateUserInput(req.body);
  if (!validationResult.valid) {
    return res.status(400).json({ errors: validationResult.errors });
  }

  // Process request
  // ...
});
```

## API Security

### CORS Configuration

Configure CORS properly on your backend:

```javascript
// Express example
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Rate Limiting

Protect your APIs from abuse:

```javascript
// Express example
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### HTTPS Only

Always use HTTPS in production:

```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

## Data Protection

### Sensitive Data in Schemas

**Never include sensitive data in client-side schemas:**

```json
{
  "type": "form",
  "fields": [
    {
      "name": "username",
      "type": "input"
    },
    {
      "name": "password",
      "type": "input",
      "inputType": "password"
    }
  ]
}
```

**❌ DON'T:**
```json
{
  "api": "/api/users",
  "headers": {
    "X-API-Secret": "hardcoded-secret-key"  // NEVER do this
  }
}
```

**✅ DO:**
```typescript
// Handle secrets server-side
const dataSource = new SecureDataSource({
  baseUrl: '/api',
  // Secrets managed server-side via cookies/session
});
```

### Password Handling

For password fields:

```json
{
  "type": "input",
  "name": "password",
  "inputType": "password",  // Masks input
  "required": true,
  "validations": {
    "minLength": 8,
    "pattern": "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d@$!%*#?&]{8,}$"
  }
}
```

### Encryption

Encrypt sensitive data at rest and in transit:

```typescript
// Use HTTPS for transit encryption (handled by web server)

// For at-rest encryption, use backend encryption
// Never encrypt on client side with keys in source code
```

## XSS Prevention

ObjectUI has built-in XSS protection, but follow these practices:

### Safe Rendering

ObjectUI automatically escapes values:

```json
{
  "type": "text",
  "value": "${data.userInput}"  // Automatically escaped
}
```

### HTML Content

If you must render HTML, sanitize it:

```typescript
import DOMPurify from 'dompurify';

// Custom renderer with sanitization
registerRenderer('safe-html', ({ value }) => {
  const clean = DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href'],
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
});
```

### Content Security Policy (CSP)

Implement CSP headers:

```html
<!-- In your HTML or via HTTP headers -->
<!-- Use nonce-based CSP for inline scripts/styles -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'nonce-{random-nonce}'; 
               style-src 'self' 'nonce-{random-nonce}'; 
               img-src 'self' data: https:; 
               font-src 'self' data:;">
```

Or via HTTP header with nonce:
```javascript
// Express - Generate a unique nonce per request
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'`
  );
  next();
});

// Then use the nonce in your inline scripts/styles:
// <script nonce="${nonce}">...</script>
// <style nonce="${nonce}">...</style>
```

**Alternative: Hash-based CSP** (for static inline content):
```javascript
// Calculate hash of your inline script/style
// Then include in CSP
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'sha256-{hash-of-script}'; style-src 'self'"
  );
  next();
});
```

**Note**: Avoid using `'unsafe-inline'` as it significantly weakens XSS protection. Use nonces or hashes instead.

## Dependency Security

### Regular Updates

Keep dependencies updated:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Or with pnpm
pnpm audit
```

### Verify Package Integrity

```bash
# Verify package checksums
pnpm install --frozen-lockfile
```

### Use Security Scanning

ObjectUI uses CodeQL for security scanning. You should too:

```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: npm audit
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
```

## Environment Variables

### Secure Configuration

**✅ DO:**
```javascript
// Use environment variables for secrets
const config = {
  apiUrl: process.env.REACT_APP_API_URL,
  // Never commit .env files with secrets
};
```

**❌ DON'T:**
```javascript
// Hardcoded secrets
const config = {
  apiKey: 'sk_live_1234567890',  // NEVER do this
  secret: 'my-secret-key',
};
```

### .env File Security

```bash
# .gitignore
.env
.env.local
.env.*.local
```

```bash
# .env.example (commit this)
REACT_APP_API_URL=https://api.example.com
# Don't include actual values
```

## File Upload Security

If implementing file uploads with ObjectUI:

### Validate File Types

```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
const maxSize = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): boolean {
  if (!allowedTypes.includes(file.type)) {
    return false;
  }
  if (file.size > maxSize) {
    return false;
  }
  return true;
}
```

### Store Files Securely

```typescript
// Backend: Store files outside web root
const uploadDir = path.join(__dirname, '../uploads');

// Generate unique filenames
const filename = `${uuid()}.${getExtension(file.originalname)}`;

// Scan files for malware (use antivirus service)
await scanFile(filepath);
```

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email security concerns to: [security@objectui.org](mailto:security@objectui.org)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We take security seriously and will respond within 48 hours.

## Security Checklist

Before deploying to production:

- [ ] All schemas validated before rendering
- [ ] Authentication and authorization implemented
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on client and server
- [ ] Sensitive data not in client code
- [ ] CSP headers configured
- [ ] Dependencies audited for vulnerabilities
- [ ] Environment variables used for secrets
- [ ] Error messages don't leak sensitive info
- [ ] File uploads validated and scanned
- [ ] Logging configured (but not logging sensitive data)
- [ ] Security headers set (HSTS, X-Frame-Options, etc.)

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://react.dev/learn/security)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)

---

**Questions about security?**

- 📧 Security concerns: [security@objectui.org](mailto:security@objectui.org)
- 💬 General questions: [GitHub Discussions](https://github.com/objectstack-ai/objectui/discussions)
