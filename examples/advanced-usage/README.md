# Advanced Usage Example

This guide covers advanced features and usage patterns for Autonomous Documentation MCP.

## Table of Contents

1. [Custom Theme Configuration](#custom-theme-configuration)
2. [Multi-Language Documentation](#multi-language-documentation)
3. [API Reference Customization](#api-reference-customization)
4. [Automated Changelog Generation](#automated-changelog-generation)
5. [Code Example Extraction](#code-example-extraction)
6. [Documentation Validation Workflows](#documentation-validation-workflows)
7. [Integration with CI/CD](#integration-with-cicd)
8. [Performance Optimization](#performance-optimization)

## Custom Theme Configuration

### Creating a Custom Theme

Create a custom theme configuration to match your brand:

```typescript
const themeConfig = {
  name: "my-custom-theme",
  colors: {
    primary: "#0D9373",
    secondary: "#1A1A1A",
    accent: "#FF6B6B",
    background: "#FFFFFF",
    text: "#2D3748"
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    headingFont: "Poppins, sans-serif",
    codeFont: "Fira Code, monospace"
  },
  components: {
    card: {
      borderRadius: "12px",
      shadow: "0 4px 6px rgba(0,0,0,0.1)"
    }
  },
  logo: {
    light: "/logo-light.svg",
    dark: "/logo-dark.svg"
  },
  favicon: "/favicon.ico"
};

const docs = await generate_documentation({
  analysis_result: JSON.stringify(analysis),
  output_dir: "./docs",
  theme: "custom",
  theme_config: themeConfig
});
```

### Using Theme Presets

Use built-in theme presets for different documentation styles:

```typescript
// Technical documentation with code focus
const technicalDocs = await generate_documentation({
  analysis_result: JSON.stringify(analysis),
  theme: "technical",
  theme_config: {
    syntax_highlighting: "github-dark",
    show_line_numbers: true,
    code_block_style: "expanded"
  }
});

// Minimal clean design
const minimalDocs = await generate_documentation({
  analysis_result: JSON.stringify(analysis),
  theme: "minimal",
  theme_config: {
    sidebarWidth: "240px",
    contentWidth: "800px"
  }
});

// Modern with rich components
const modernDocs = await generate_documentation({
  analysis_result: JSON.stringify(analysis),
  theme: "modern",
  theme_config: {
    animations: true,
    gradients: true,
    glassmorphism: true
  }
});
```

## Multi-Language Documentation

### Supporting Multiple Programming Languages

Generate documentation for polyglot projects:

```typescript
const analysis = await analyze_codebase({
  path: "/path/to/project",
  depth: "comprehensive",
  include_patterns: [
    // Frontend
    "**/*.ts",
    "**/*.tsx",
    "**/*.jsx",
    // Backend
    "**/*.py",
    "**/*.go",
    // Mobile
    "**/*.swift",
    "**/*.kt"
  ],
  language_config: {
    typescript: {
      parse_jsdoc: true,
      include_types: true
    },
    python: {
      parse_docstrings: true,
      docstring_style: "google"  // google, numpy, sphinx
    },
    go: {
      parse_godoc: true
    }
  }
});
```

### Language-Specific API Documentation

```typescript
const apiDocs = await generate_api_reference({
  source_path: "./src",
  output_path: "./docs/api",
  format: "mintlify",
  language_sections: {
    typescript: {
      title: "TypeScript API",
      description: "Client-side TypeScript interfaces and utilities"
    },
    python: {
      title: "Python API",
      description: "Server-side Python API reference"
    }
  },
  cross_reference: true  // Link related APIs across languages
});
```

## API Reference Customization

### Detailed API Documentation

Generate comprehensive API reference with custom sections:

```typescript
const apiRef = await generate_api_reference({
  source_path: "./src/api",
  output_path: "./docs/api",
  format: "mintlify",
  include_private: false,
  sections: {
    authentication: {
      title: "Authentication",
      description: "Authentication and authorization endpoints",
      order: 1
    },
    users: {
      title: "User Management",
      description: "User CRUD operations",
      order: 2
    },
    data: {
      title: "Data Operations",
      description: "Data manipulation and queries",
      order: 3
    }
  },
  examples: {
    include_request_examples: true,
    include_response_examples: true,
    include_error_examples: true,
    languages: ["curl", "javascript", "python", "go"]
  },
  metadata: {
    version: "v1.0.0",
    base_url: "https://api.example.com",
    rate_limiting: {
      enabled: true,
      limit: "1000 requests/hour"
    }
  }
});
```

### OpenAPI Integration

Export API documentation in OpenAPI format:

```typescript
const openapi = await generate_api_reference({
  source_path: "./src/api",
  output_path: "./docs/openapi.yaml",
  format: "openapi",
  openapi_config: {
    version: "3.1.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "Comprehensive API documentation"
    },
    servers: [
      {
        url: "https://api.example.com/v1",
        description: "Production"
      },
      {
        url: "https://staging-api.example.com/v1",
        description: "Staging"
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ]
  }
});
```

## Automated Changelog Generation

### Generate from Git History

Create changelogs automatically from git commits:

```typescript
const changelog = await generate_changelog({
  repo_path: process.cwd(),
  from_version: "v1.0.0",
  to_version: "HEAD",
  format: "keep-a-changelog",
  sections: {
    breaking: "Breaking Changes",
    feat: "Features",
    fix: "Bug Fixes",
    docs: "Documentation",
    perf: "Performance",
    refactor: "Refactoring",
    test: "Tests",
    chore: "Maintenance"
  },
  include_authors: true,
  include_pr_links: true,
  group_by_component: true
});

// Save to file
fs.writeFileSync('./docs/changelog.mdx', changelog);
```

### Semantic Release Integration

```typescript
// Generate changelog for specific version
const versionChangelog = await generate_changelog({
  repo_path: process.cwd(),
  from_version: "v1.2.0",
  to_version: "v1.3.0",
  format: "conventional",
  semantic_versioning: {
    detect_breaking: true,
    suggest_next_version: true
  }
});

// Output includes suggested version
console.log(versionChangelog.suggested_version); // "2.0.0" if breaking changes
```

## Code Example Extraction

### Extract from Test Files

Automatically extract examples from test suites:

```typescript
const examples = await extract_code_examples({
  source_path: "./tests",
  output_path: "./docs/examples",
  categories: ["unit", "integration", "e2e"],
  filters: {
    include_patterns: ["**/*.test.ts", "**/*.spec.ts"],
    exclude_patterns: ["**/*.skip.ts"],
    min_lines: 5,
    max_lines: 50
  },
  formatting: {
    remove_test_boilerplate: true,
    add_comments: true,
    include_imports: true
  }
});
```

### Create Interactive Examples

Generate interactive code examples:

```typescript
const interactiveExamples = await extract_code_examples({
  source_path: "./examples",
  output_path: "./docs/interactive",
  format: "interactive",
  interactive_config: {
    editable: true,
    runnable: true,
    show_output: true,
    sandbox: "codesandbox"  // codesandbox, stackblitz, repl.it
  },
  categories: {
    basic: {
      title: "Basic Usage",
      description: "Simple examples to get started"
    },
    advanced: {
      title: "Advanced Patterns",
      description: "Complex use cases and patterns"
    }
  }
});
```

## Documentation Validation Workflows

### Comprehensive Validation

Run thorough validation with custom rules:

```typescript
const validation = await validate_documentation({
  docs_path: "./docs",
  strict: true,
  check_links: true,
  check_code_examples: true,
  custom_rules: {
    // Enforce frontmatter fields
    required_frontmatter: ["title", "description", "icon"],

    // Link validation
    link_rules: {
      allow_external: true,
      verify_external: true,
      allowed_domains: ["github.com", "npmjs.com", "example.com"]
    },

    // Code validation
    code_rules: {
      validate_syntax: true,
      check_imports: true,
      verify_types: true
    },

    // Content rules
    content_rules: {
      min_words: 100,
      max_heading_depth: 4,
      require_examples: true
    }
  }
});

// Handle validation results
if (validation.errors.length > 0) {
  console.error('Critical errors:');
  validation.errors.forEach(err => {
    console.error(`  ${err.file}: ${err.message}`);
  });
  process.exit(1);
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:');
  validation.warnings.forEach(warn => {
    console.warn(`  ${warn.file}: ${warn.message}`);
  });
}
```

### Custom Validators

Create custom validation plugins:

```typescript
const customValidation = {
  name: "brand-compliance",
  rules: [
    {
      name: "check-brand-terms",
      validate: (content) => {
        // Ensure brand names are capitalized correctly
        const issues = [];
        if (content.includes("mintlify") && !content.includes("Mintlify")) {
          issues.push("Brand name 'Mintlify' should be capitalized");
        }
        return issues;
      }
    },
    {
      name: "check-code-style",
      validate: (code, language) => {
        // Ensure code examples follow style guide
        if (language === "javascript") {
          if (code.includes("var ")) {
            return ["Use 'const' or 'let' instead of 'var'"];
          }
        }
        return [];
      }
    }
  ]
};

const validation = await validate_documentation({
  docs_path: "./docs",
  custom_validators: [customValidation]
});
```

## Integration with CI/CD

### GitHub Actions Workflow

Complete GitHub Actions workflow:

```yaml
name: Documentation CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          npm install
          npm install -g autonomous-docs-mcp

      - name: Validate existing docs
        run: |
          node -e "
            const { validate_documentation } = require('autonomous-docs-mcp');
            validate_documentation({
              docs_path: './docs',
              strict: true
            }).then(result => {
              if (result.errors.length > 0) process.exit(1);
            });
          "

  generate:
    needs: validate
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3

      - name: Generate documentation
        run: |
          node -e "
            const { analyze_codebase, generate_documentation } = require('autonomous-docs-mcp');
            (async () => {
              const analysis = await analyze_codebase({
                path: process.cwd(),
                depth: 'comprehensive'
              });
              await generate_documentation({
                analysis_result: JSON.stringify(analysis),
                output_dir: './docs'
              });
            })();
          "

      - name: Commit updated docs
        uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "docs: auto-update documentation [skip ci]"
          file_pattern: "docs/**"

  deploy:
    needs: generate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Mintlify
        run: |
          npm install -g mintlify
          cd docs
          mintlify deploy
        env:
          MINTLIFY_TOKEN: ${{ secrets.MINTLIFY_TOKEN }}
```

## Performance Optimization

### Large Codebase Optimization

Handle large repositories efficiently:

```typescript
// Use incremental analysis
const incrementalAnalysis = await analyze_codebase({
  path: "/large/project",
  depth: "quick",
  incremental: true,
  cache: {
    enabled: true,
    cache_dir: "./.autodocs-cache",
    ttl: 3600  // 1 hour
  },
  parallel: {
    enabled: true,
    max_workers: 4
  },
  memory_limit: "4GB"
});

// Stream large files
const streamingDocs = await generate_documentation({
  analysis_result: JSON.stringify(incrementalAnalysis),
  output_dir: "./docs",
  streaming: true,
  batch_size: 100
});
```

### Caching Strategy

Implement effective caching:

```typescript
const cachedAnalysis = await analyze_codebase({
  path: process.cwd(),
  cache: {
    enabled: true,
    strategy: "smart",  // smart, aggressive, minimal
    invalidate_on: ["git-commit", "file-change"],
    cache_files: true,
    cache_analysis: true
  }
});
```

## Advanced Sync Workflows

### Selective Sync

Sync only specific parts of documentation:

```typescript
const selectiveSync = await sync_documentation({
  docs_path: "./docs",
  source_path: "./src",
  auto_update: true,
  filters: {
    // Only sync API documentation
    include_sections: ["api"],

    // Ignore certain files
    exclude_files: ["introduction.mdx", "quickstart.mdx"],

    // Only sync if significant changes
    change_threshold: 0.2  // 20% change required
  },
  conflict_resolution: "prompt"  // prompt, auto, manual
});
```

### Watch Mode

Continuously watch for changes:

```typescript
import { watch } from 'fs';

const watcher = watch('./src', { recursive: true }, async (event, filename) => {
  console.log(`File changed: ${filename}`);

  // Analyze only changed files
  const analysis = await analyze_codebase({
    path: './src',
    files: [filename],
    depth: 'quick'
  });

  // Update related documentation
  await sync_documentation({
    docs_path: './docs',
    source_path: './src',
    auto_update: true,
    incremental: true
  });

  console.log('Documentation updated');
});
```

## Next Steps

- Explore [Multi-Repo Aggregation](../multi-repo/README.md)
- Learn about [Pre-commit Hooks](../pre-commit/README.md)
- Set up [Continuous Sync](../continuous-sync/README.md)
- Check out [Custom Themes](../custom-theme/README.md)

## Support

For advanced usage questions:
- Check [GitHub Discussions](https://github.com/perryjr1444/autonomous-docs-mcp/discussions)
- Review [API Documentation](../../README.md#api-reference)
- Open an [issue](https://github.com/perryjr1444/autonomous-docs-mcp/issues)
