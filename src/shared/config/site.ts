export const siteConfig = {
  name: "seunan.dev",
  description: "Terminal-style blog powered by Notion",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://seunan.dev",
  author: {
    name: "Aiden Ahn",
    username: "seunan",
    role: "Software Engineer",
    github: "https://github.com/seungwonme",
  },
  prompt: {
    user: "visitor",
    host: "seunan.dev",
    separator: "$",
  },
} as const;
