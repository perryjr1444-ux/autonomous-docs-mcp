import * as fs from "fs-extra";
import * as path from "path";

export interface DocsConfig {
  name: string;
  logo?: {
    light: string;
    dark: string;
  };
  favicon?: string;
  colors?: {
    primary: string;
    light: string;
    dark: string;
  };
  navigation: NavigationItem[];
  topbarLinks?: TopbarLink[];
  topbarCtaButton?: {
    name: string;
    url: string;
  };
  anchors?: Anchor[];
  footerSocials?: Record<string, string>;
}

export interface NavigationItem {
  group: string;
  pages: (string | NavigationItem)[];
}

export interface TopbarLink {
  name: string;
  url: string;
}

export interface Anchor {
  name: string;
  icon: string;
  url: string;
}

export class DocsConfigGenerator {
  async generate(options: {
    projectName: string;
    structure: any;
    themeConfig?: any;
    integrations?: string[];
  }): Promise<DocsConfig> {
    console.error("Generating docs.json configuration...");

    const config: DocsConfig = {
      name: options.projectName,
      colors: {
        primary: options.themeConfig?.primaryColor || "#0D9373",
        light: options.themeConfig?.lightColor || "#07C983",
        dark: options.themeConfig?.darkColor || "#0D9373",
      },
      navigation: this.buildNavigation(options.structure),
      topbarLinks: [
        {
          name: "Documentation",
          url: "https://docs.example.com",
        },
      ],
      topbarCtaButton: {
        name: "Get Started",
        url: "/quickstart",
      },
      anchors: [
        {
          name: "API Reference",
          icon: "code",
          url: "/api",
        },
        {
          name: "GitHub",
          icon: "github",
          url: "https://github.com",
        },
      ],
      footerSocials: {
        github: "https://github.com",
        twitter: "https://twitter.com",
      },
    };

    return config;
  }

  private buildNavigation(structure: any): NavigationItem[] {
    // Convert analysis structure to navigation
    const nav: NavigationItem[] = [
      {
        group: "Getting Started",
        pages: ["introduction", "quickstart"],
      },
      {
        group: "API Reference",
        pages: ["api/overview"],
      },
      {
        group: "Guides",
        pages: ["guides/overview"],
      },
    ];

    return nav;
  }

  async writeConfig(config: DocsConfig, outputPath: string): Promise<void> {
    const configPath = path.join(outputPath, "docs.json");
    await fs.writeJson(configPath, config, { spaces: 2 });
    console.error(`Created: ${configPath}`);
  }
}
