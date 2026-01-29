# Contributing to Trigr

First off, thank you for considering contributing to Trigr! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

---

## 📜 Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.

**Be respectful, inclusive, and constructive.**

---

## 🤝 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**Great bug reports include:**

- A clear, descriptive title
- Steps to reproduce the behavior
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Node version, etc.)

### 💡 Suggesting Features

Feature suggestions are welcome! Please provide:

- A clear description of the feature
- Why it would be useful
- Possible implementation approach

### 🔧 Pull Requests

We love pull requests! Here's how to get started:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a PR

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 16+ (or Docker)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/cutepawss/trigr.git
cd trigr

# Install dependencies
pnpm install

# Set up environment
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# Start database
docker-compose up -d

# Run migrations
cd apps/api && pnpm prisma migrate dev

# Start development servers
pnpm dev
```

### Project Structure

```
trigr/
├── apps/
│   ├── api/          # Express backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # Shared types & schemas
└── docs/             # Documentation
```

---

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows the style guide
- [ ] All tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Documentation updated if needed
- [ ] Commit messages are clear

### PR Title Format

```
type(scope): description

Examples:
feat(api): add DCA intent support
fix(web): correct price chart display
docs: update API reference
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

---

## 📝 Style Guide

### TypeScript

- Use TypeScript for all new code
- Prefer `interface` over `type` for objects
- Use explicit return types for functions

### Naming

- **Files**: `kebab-case.ts`
- **Components**: `PascalCase.tsx`
- **Variables/Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`

### Code Quality

```bash
# Format code
pnpm format

# Check linting
pnpm lint

# Run tests
pnpm test
```

---

## 🏷️ Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `good first issue` | Great for newcomers |
| `help wanted` | Extra attention needed |
| `docs` | Documentation improvements |

---

## 💬 Questions?

Feel free to open an issue or start a discussion on GitHub.

---

Thank you for contributing! 🚀
