# Security Guidelines

## Sensitive Information

This project handles sensitive information. Please follow these guidelines:

### Environment Variables

Never commit the following to version control:
- API keys (Google Places, SerpAPI, etc.)
- Database credentials
- OAuth tokens
- Personal information (addresses, phone numbers, etc.)

### Setup Instructions

1. **Create a local `.env` file** (not committed to git):
   ```bash
   cp .env.example .env
   ```

2. **Add your API keys** to the `.env` file:
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
   ```

3. **Never commit `.env` files** - they are in `.gitignore`

### Mock Data

The project includes mock business data for development and testing. This data:
- Contains fictional business information
- Is safe to commit to version control
- Should not be replaced with real user data without proper consent

### API Keys

If you need to add new API keys:
1. Add them to `.env` file locally
2. Never push `.env` to GitHub
3. Document the required keys in `.env.example` (without values)

### Personal Information

Never commit:
- Real home addresses
- Real phone numbers
- Real personal details
- User credentials
- Private business information

### Credentials Management

For team collaboration:
1. Share `.env` files through secure channels (not GitHub)
2. Use GitHub Secrets for CI/CD pipelines
3. Rotate API keys regularly
4. Use different keys for development and production

## Checking Before Commits

Before committing, verify:
```bash
# Check for sensitive files
git status

# Ensure .env files are not staged
git diff --cached

# View what will be committed
git diff --cached --stat
```

## If You Accidentally Commit Secrets

1. **Immediately revoke the compromised key**
2. **Remove from git history**:
   ```bash
   git filter-branch --tree-filter 'rm -f .env' HEAD
   git push origin --force-with-lease
   ```
3. **Generate new credentials**
4. **Notify relevant services**

## Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)
