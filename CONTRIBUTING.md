# Contributing to Autonomous Documentation MCP

Thank you for your interest in contributing to Autonomous Documentation MCP! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior:

- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Call tool '...'
2. With parameters '...'
3. See error

**Expected behavior**
What you expected to happen.

**Actual behavior**
What actually happened.

**Environment:**
- OS: [e.g. macOS 13.0]
- Node.js version: [e.g. 18.17.0]
- Package version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

**Enhancement Request Template:**

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Any alternative solutions or features you've considered.

**Additional context**
Any other context, mockups, or examples.
```

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** if you've added code that should be tested
4. **Update documentation** if you've changed APIs or added features
5. **Ensure tests pass** by running `npm test`
6. **Lint your code** by running `npm run lint`
7. **Commit your changes** using a descriptive commit message
8. **Push to your fork** and submit a pull request

**Pull Request Template:**

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested the MCP server integration

## Documentation
- [ ] I have updated the README.md if needed
- [ ] I have updated API documentation if needed
- [ ] I have added/updated examples if needed

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

## Development Process

### Setting Up Your Development Environment

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/autonomous-docs-mcp.git
cd autonomous-docs-mcp

# Add upstream remote
git remote add upstream https://github.com/perryjr1444/autonomous-docs-mcp.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes**
   - Write code following our style guide
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run all tests
   npm test

   # Run tests in watch mode
   npm run test:watch

   # Run tests with coverage
   npm run test:coverage
   ```

4. **Lint your code**
   ```bash
   # Check for linting errors
   npm run lint

   # Auto-fix linting errors
   npm run lint:fix
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   ```

6. **Keep your branch up to date**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/my-new-feature
   ```

8. **Create a Pull Request**
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

## Coding Standards

### TypeScript Style Guide

We follow the TypeScript style guide with some additional conventions:

**File Naming**
- Use kebab-case for file names: `codebase-analyzer.ts`
- Use PascalCase for class files: `CodebaseAnalyzer.ts`
- Test files should have `.test.ts` suffix

**Code Formatting**
```typescript
// Use 2 spaces for indentation
// Use semicolons
// Use single quotes for strings
// Use template literals for string interpolation

// Good
const message = 'Hello, world!';
const greeting = `Hello, ${name}!`;

// Bad
const message = "Hello, world!"
const greeting = 'Hello, ' + name + '!'
```

**Naming Conventions**
```typescript
// Classes and Interfaces: PascalCase
class CodebaseAnalyzer {}
interface AnalysisResult {}

// Functions and Variables: camelCase
function analyzeCodebase() {}
const analysisResult = {};

// Constants: UPPER_SNAKE_CASE
const MAX_DEPTH = 10;
const DEFAULT_THEME = 'modern';

// Private members: prefix with underscore
class MyClass {
  private _privateField: string;
  private _privateMethod() {}
}
```

**Comments**
```typescript
/**
 * Analyze codebase structure and generate documentation plan
 *
 * @param path - Root path to analyze
 * @param options - Analysis options
 * @returns Analysis result with structure and recommendations
 *
 * @example
 * ```typescript
 * const result = await analyzeCodebase('/path/to/project', {
 *   depth: 'comprehensive'
 * });
 * ```
 */
async function analyzeCodebase(
  path: string,
  options: AnalysisOptions
): Promise<AnalysisResult> {
  // Implementation
}
```

**Error Handling**
```typescript
// Always use try-catch for async operations
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  if (error instanceof McpError) {
    throw error;
  }
  throw new McpError(
    ErrorCode.InternalError,
    `Operation failed: ${error.message}`
  );
}
```

**Imports**
```typescript
// Group imports in this order:
// 1. External libraries
// 2. Internal modules
// 3. Type imports

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { CodebaseAnalyzer } from "./analyzers/codebase-analyzer.js";
import { MDXGenerator } from "./generators/mdx-generator.js";

import type { AnalysisOptions, AnalysisResult } from "./types.js";
```

### Testing Standards

**Test Structure**
```typescript
describe('CodebaseAnalyzer', () => {
  let analyzer: CodebaseAnalyzer;

  beforeEach(() => {
    analyzer = new CodebaseAnalyzer();
  });

  describe('analyze', () => {
    it('should analyze TypeScript files', async () => {
      const result = await analyzer.analyze('/path/to/ts/project');
      expect(result.files).toContain('index.ts');
    });

    it('should handle errors gracefully', async () => {
      await expect(
        analyzer.analyze('/nonexistent/path')
      ).rejects.toThrow('Path not found');
    });
  });
});
```

**Test Coverage**
- Aim for at least 80% code coverage
- Test both success and error cases
- Test edge cases and boundary conditions
- Mock external dependencies

**Test Naming**
```typescript
// Good
it('should return analysis result for valid path', () => {});
it('should throw error for invalid path', () => {});
it('should respect exclude patterns', () => {});

// Bad
it('test analyze', () => {});
it('error case', () => {});
```

### Documentation Standards

**README Updates**
- Update feature list when adding new features
- Add usage examples for new tools
- Update API reference for changed interfaces
- Add troubleshooting section for common issues

**Code Documentation**
- All public functions must have JSDoc comments
- Include parameter descriptions
- Include return value descriptions
- Provide usage examples for complex functions

**Examples**
- Create runnable examples in `examples/` directory
- Include README in example directories
- Show real-world use cases
- Include both basic and advanced examples

## Git Commit Messages

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(analyzer): add support for Python docstrings

Add Python docstring parsing to codebase analyzer.
Supports Google, NumPy, and Sphinx docstring formats.

Closes #123

---

fix(validator): correct link validation regex

The previous regex was not matching relative links correctly.
Updated to handle both absolute and relative links.

---

docs(readme): add troubleshooting section

Add common issues and solutions to help users debug problems.
```

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md` with release notes
3. Run full test suite: `npm test`
4. Build the project: `npm run build`
5. Create git tag: `git tag -a v1.x.x -m "Release v1.x.x"`
6. Push tag: `git push origin v1.x.x`
7. Create GitHub release with changelog
8. Publish to npm: `npm publish`

## Project Structure

Understanding the project structure will help you contribute effectively:

```
autonomous-docs-mcp/
├── src/
│   ├── index.ts                      # MCP server entry point
│   ├── analyzers/
│   │   └── codebase-analyzer.ts     # Codebase analysis
│   ├── generators/
│   │   ├── mdx-generator.ts         # MDX generation
│   │   └── docs-config-generator.ts # Config generation
│   ├── validators/
│   │   └── doc-validator.ts         # Validation logic
│   └── types/
│       └── index.ts                  # Type definitions
├── tests/
│   ├── analyzers/
│   ├── generators/
│   └── validators/
├── examples/                          # Usage examples
├── docs/                              # Project documentation
├── dist/                              # Compiled output
└── scripts/                           # Build and utility scripts
```

## Questions?

If you have questions about contributing, please:

1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Open a new issue with the question label

## Recognition

Contributors will be recognized in:

- Project README
- Release notes
- Contributors section on GitHub

Thank you for contributing to Autonomous Documentation MCP!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
