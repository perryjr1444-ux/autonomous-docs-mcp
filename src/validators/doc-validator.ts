import * as fs from "fs-extra";
import * as path from "path";
import { glob } from "glob";
import matter from "gray-matter";

export interface ValidationOptions {
  strict: boolean;
  checkLinks: boolean;
  checkCodeExamples: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

export interface ValidationError {
  file: string;
  line?: number;
  type: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationWarning {
  file: string;
  line?: number;
  type: string;
  message: string;
}

export interface ValidationSummary {
  total_files: number;
  files_with_errors: number;
  total_errors: number;
  total_warnings: number;
}

export class DocumentationValidator {
  async validate(
    docsPath: string,
    options: ValidationOptions
  ): Promise<ValidationResult> {
    console.error(`Validating documentation at ${docsPath}...`);

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Find all MDX files
    const mdxFiles = await glob("**/*.{md,mdx}", {
      cwd: docsPath,
      absolute: false,
    });

    let filesWithErrors = 0;

    for (const file of mdxFiles) {
      const filePath = path.join(docsPath, file);
      const content = await fs.readFile(filePath, "utf-8");

      // Validate frontmatter
      const frontmatterErrors = await this.validateFrontmatter(
        file,
        content,
        options
      );
      errors.push(...frontmatterErrors);

      // Validate links
      let linkErrors: ValidationError[] = [];
      if (options.checkLinks) {
        linkErrors = await this.validateLinks(file, content, docsPath);
        errors.push(...linkErrors);
      }

      // Validate code examples
      if (options.checkCodeExamples) {
        const codeErrors = await this.validateCodeExamples(file, content);
        warnings.push(...codeErrors);
      }

      // Check for common issues
      const commonIssues = this.checkCommonIssues(file, content);
      warnings.push(...commonIssues);

      if (
        frontmatterErrors.length > 0 ||
        (options.checkLinks && linkErrors.length > 0)
      ) {
        filesWithErrors++;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        total_files: mdxFiles.length,
        files_with_errors: filesWithErrors,
        total_errors: errors.length,
        total_warnings: warnings.length,
      },
    };
  }

  private async validateFrontmatter(
    file: string,
    content: string,
    options: ValidationOptions
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      const parsed = matter(content);

      // Check required fields
      if (!parsed.data.title) {
        errors.push({
          file,
          type: "missing_frontmatter",
          message: "Missing required frontmatter field: title",
          severity: "error",
        });
      }

      if (!parsed.data.description && options.strict) {
        errors.push({
          file,
          type: "missing_frontmatter",
          message: "Missing recommended frontmatter field: description",
          severity: "warning",
        });
      }
    } catch (error) {
      errors.push({
        file,
        type: "invalid_frontmatter",
        message: `Invalid frontmatter: ${error}`,
        severity: "error",
      });
    }

    return errors;
  }

  private async validateLinks(
    file: string,
    content: string,
    docsPath: string
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Find all markdown links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];

      // Check internal links
      if (linkUrl.startsWith("/") || !linkUrl.includes("://")) {
        const targetPath = linkUrl.startsWith("/")
          ? path.join(docsPath, linkUrl)
          : path.join(docsPath, path.dirname(file), linkUrl);

        // Check if file exists (with .mdx extension if not specified)
        const possiblePaths = [
          targetPath,
          `${targetPath}.mdx`,
          `${targetPath}.md`,
          path.join(targetPath, "index.mdx"),
        ];

        const exists = await Promise.any(
          possiblePaths.map((p) =>
            fs.pathExists(p).then((exists: boolean) => (exists ? p : Promise.reject()))
          )
        ).catch(() => false);

        if (!exists) {
          errors.push({
            file,
            type: "broken_link",
            message: `Broken internal link: ${linkUrl}`,
            severity: "error",
          });
        }
      }
    }

    return errors;
  }

  private async validateCodeExamples(
    file: string,
    content: string
  ): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    // Find code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1];
      const code = match[2];

      if (!language) {
        warnings.push({
          file,
          type: "missing_code_language",
          message: "Code block missing language specifier",
        });
      }

      // Basic syntax checks
      if (code.trim().length === 0) {
        warnings.push({
          file,
          type: "empty_code_block",
          message: "Empty code block found",
        });
      }
    }

    return warnings;
  }

  private checkCommonIssues(file: string, content: string): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for absolute URLs to internal docs
    if (content.includes("http://localhost") || content.includes("https://docs.example.com")) {
      warnings.push({
        file,
        type: "absolute_internal_url",
        message: "Consider using relative paths for internal links",
      });
    }

    // Check for missing alt text on images
    const imageRegex = /!\[\]\([^)]+\)/g;
    if (imageRegex.test(content)) {
      warnings.push({
        file,
        type: "missing_alt_text",
        message: "Image found without alt text",
      });
    }

    return warnings;
  }
}
