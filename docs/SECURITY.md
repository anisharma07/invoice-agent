# 🔒 Security Best Practices

This document outlines security best practices for working with this project.

## 🚨 Critical: Never Commit Secrets!

### What NOT to Commit:
- ❌ `.env` files with real credentials
- ❌ AWS access keys or secret keys
- ❌ API keys or tokens
- ❌ Private keys (`.pem`, `.key`, `.p12`, etc.)
- ❌ SSL certificates
- ❌ Database passwords
- ❌ SSH keys
- ❌ Android/iOS signing keys or keystores
- ❌ OAuth client secrets
- ❌ Session secrets or JWT secrets
- ❌ Any file containing sensitive configuration

### ✅ What You CAN Commit:
- ✅ `.env.example` (with placeholder values only)
- ✅ Configuration templates
- ✅ Documentation
- ✅ Public keys (if necessary)
- ✅ Sample data (anonymized)

---

## 🛡️ Environment Variables

### Setup Process:
1. **Copy the template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values:**
   ```bash
   # Edit .env with your actual credentials
   nano .env  # or vim, code, etc.
   ```

3. **Verify .env is in .gitignore:**
   ```bash
   grep -n "\.env" .gitignore
   ```

4. **Check for accidentally staged secrets:**
   ```bash
   git status
   # Make sure .env is NOT in the list
   ```

### AWS Credentials Best Practices:

#### Option 1: Environment Variables (for Docker/Development)
```bash
# In your .env file:
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_REGION=us-east-1
```

#### Option 2: AWS CLI Configuration (Recommended for Local Development)
```bash
# More secure - stores credentials separately
aws configure

# Credentials stored in ~/.aws/credentials
# Never commit this directory!
```

#### Option 3: IAM Roles (Recommended for Production/EC2/ECS)
- Use IAM roles for AWS services (EC2, ECS, Lambda, etc.)
- No credentials in code or environment variables
- Automatic credential rotation

---

## 🔐 API Keys and Tokens

### Storage:
- **Development:** Use `.env` files (never commit!)
- **Production:** Use secret management services:
  - AWS Secrets Manager
  - AWS Systems Manager Parameter Store
  - HashiCorp Vault
  - Docker Secrets
  - Kubernetes Secrets

### Rotation:
- Rotate API keys regularly (every 90 days minimum)
- Rotate immediately if:
  - A key is accidentally committed
  - An employee with access leaves
  - You suspect a breach

---

## 🚀 Production Deployment

### Docker Secrets:
```yaml
# docker-compose.prod.yml
services:
  backend:
    secrets:
      - aws_access_key
      - aws_secret_key

secrets:
  aws_access_key:
    external: true
  aws_secret_key:
    external: true
```

### Environment-Specific Configuration:
```bash
# Use different .env files for different environments
.env.development
.env.staging
.env.production

# Load appropriate file based on NODE_ENV
```

---

## 🔍 Security Checklist

### Before Committing:
- [ ] Verified `.env` is NOT staged (`git status`)
- [ ] Checked for hardcoded credentials in code
- [ ] Reviewed all changed files for sensitive data
- [ ] Used `.env.example` with placeholders only
- [ ] Updated `.gitignore` if needed

### Regular Security Audits:
- [ ] Review repository for accidentally committed secrets
- [ ] Scan with tools like `git-secrets` or `truffleHog`
- [ ] Check for exposed credentials in commit history
- [ ] Audit access to repositories and AWS accounts
- [ ] Review IAM policies and permissions

### Tools for Scanning:
```bash
# Install git-secrets
git secrets --install
git secrets --register-aws

# Scan repository
git secrets --scan

# Scan commit history
git secrets --scan-history
```

---

## 🚨 If You Accidentally Commit Secrets

### Immediate Actions:
1. **Rotate the compromised credentials immediately!**
   - Revoke/delete the old key
   - Generate a new key
   - Update all services using the key

2. **Remove from Git history:**
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   # WARNING: This rewrites history!
   
   # Using BFG (recommended)
   bfg --delete-files .env
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Force push (requires team coordination)
   git push --force
   ```

3. **Notify your team**

4. **Check logs for unauthorized access**

---

## 📱 Mobile App Security

### Android:
```gitignore
# Already in .gitignore:
keystore.properties
*.keystore
*.jks
local.properties
```

### iOS:
```gitignore
# Already in .gitignore:
*.mobileprovision
*.p12
*.cer
```

### Never commit:
- Signing certificates
- Provisioning profiles
- API keys in code
- Firebase config with sensitive data

---

## 🔗 Additional Resources

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Docker Secrets Management](https://docs.docker.com/engine/swarm/secrets/)
- [12-Factor App - Config](https://12factor.net/config)

---

## 📞 Reporting Security Issues

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

---

## 🔄 Regular Maintenance

### Monthly:
- [ ] Review access logs
- [ ] Audit user permissions
- [ ] Check for security updates

### Quarterly:
- [ ] Rotate credentials
- [ ] Security audit of codebase
- [ ] Review and update security policies

### Yearly:
- [ ] Comprehensive security review
- [ ] Penetration testing (if applicable)
- [ ] Update security documentation
