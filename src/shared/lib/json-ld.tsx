import type {
  Blog,
  BlogPosting,
  BreadcrumbList,
  FAQPage,
  Organization,
  Person,
  Product,
  WebPage,
  WebSite,
  WithContext,
} from "schema-dts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.aidenahn.com";
const SITE_NAME = "aidenahn.com";

// 안정적 엔티티 식별자 — 페이지마다 같은 @id를 참조해 저자/사이트 신호를 누적한다.
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const ORG_ID = `${SITE_URL}/#organization`;
const BLOG_ID = `${SITE_URL}/#blog`;

const AUTHOR_NAME = "Aiden Ahn";
const GITHUB_URL = "https://github.com/seungwonme";
const LINKEDIN_URL = "https://www.linkedin.com/in/seungwon-aiden/";
const LOGO_URL = `${SITE_URL}/icon-512.png`;

type JsonLdType =
  | WithContext<WebSite>
  | WithContext<WebPage>
  | WithContext<BlogPosting>
  | WithContext<Blog>
  | WithContext<Organization>
  | WithContext<Person>
  | WithContext<BreadcrumbList>
  | WithContext<Product>
  | WithContext<FAQPage>;

interface JsonLdProps {
  data: JsonLdType;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires dangerouslySetInnerHTML
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function createWebSiteJsonLd(): WithContext<WebSite> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ko-KR",
    publisher: { "@id": PERSON_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    } as WithContext<WebSite>["potentialAction"],
  };
}

interface WebPageJsonLdOptions {
  title: string;
  description: string;
  url: string;
}

export function createWebPageJsonLd(
  options: WebPageJsonLdOptions,
): WithContext<WebPage> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: options.title,
    description: options.description,
    url: options.url,
    inLanguage: "ko-KR",
    isPartOf: { "@id": WEBSITE_ID },
  };
}

interface ArticleJsonLdOptions {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  inLanguage?: string;
  section?: string;
  keywords?: string[];
  wordCount?: number;
}

export function createArticleJsonLd(
  options: ArticleJsonLdOptions,
): WithContext<BlogPosting> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: options.title,
    description: options.description,
    url: options.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": options.url },
    image: options.image,
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    inLanguage: options.inLanguage || "ko-KR",
    articleSection: options.section,
    keywords: options.keywords,
    wordCount: options.wordCount,
    author: { "@id": PERSON_ID },
    publisher: {
      "@type": "Organization",
      "@id": ORG_ID,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
    isPartOf: { "@id": BLOG_ID },
  };
}

interface BlogPostItem {
  title: string;
  slug: string;
  category: string;
  date: string;
}

export function createBlogJsonLd(posts: BlogPostItem[]): WithContext<Blog> {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": BLOG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ko-KR",
    publisher: { "@id": PERSON_ID },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `${SITE_URL}/${p.category}/${p.slug}`,
      datePublished: p.date,
      author: { "@id": PERSON_ID },
    })),
  };
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function createBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

interface OrganizationJsonLdOptions {
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}

export function createOrganizationJsonLd(
  options: OrganizationJsonLdOptions,
): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: options.name,
    url: options.url,
    logo: options.logo,
    sameAs: options.sameAs,
  };
}

interface PersonJsonLdOptions {
  name: string;
  url: string;
  jobTitle?: string;
  alternateName?: string[];
  description?: string;
  image?: string;
  worksFor?: { name: string; url?: string }[];
  alumniOf?: { name: string; url?: string }[];
  award?: string[];
  knowsAbout?: string[];
  sameAs?: string[];
}

// 사이트 저자(고정 1인). 인자 없이 호출하면 풀 E-E-A-T Person을 반환한다.
const AUTHOR_DEFAULTS: PersonJsonLdOptions = {
  name: AUTHOR_NAME,
  url: SITE_URL,
  jobTitle: "AX Director · Co-founder",
  alternateName: ["안승원", "Seungwon Ahn"],
  description:
    "AI 에이전트로 일하는 방식을 바꾸고 그 방법을 공유하는 AI Native Engineer. 조코딩AX파트너스 AX Director이자 대모산개발단 공동창업자(CCO).",
  worksFor: [
    { name: "조코딩AX파트너스", url: "https://jocodingax.ai/" },
    { name: "대모산개발단 (DemoDev)", url: "https://demodev.io/" },
  ],
  alumniOf: [
    { name: "42 Seoul", url: "https://42seoul.kr/" },
    { name: "LG AI Research (LG Aimers)", url: "https://www.lgaimers.ai/" },
  ],
  award: ["과학기술정보통신부 장관상 (Codyssey X SeSAC, 2025)"],
  knowsAbout: [
    "AI 자동화",
    "바이브 코딩",
    "AI 에이전트",
    "n8n",
    "Claude Code",
    "LangGraph",
    "DevRel",
  ],
  sameAs: [
    GITHUB_URL,
    LINKEDIN_URL,
    "https://www.youtube.com/@%EB%8C%80%EB%AA%A8%EC%82%B0%EA%B0%9C%EB%B0%9C%EB%8B%A8",
    "https://fastcampus.co.kr/story_interview_demosan",
  ],
};

export function createPersonJsonLd(
  options: PersonJsonLdOptions = AUTHOR_DEFAULTS,
): WithContext<Person> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: options.name,
    url: options.url,
    jobTitle: options.jobTitle,
    alternateName: options.alternateName,
    description: options.description,
    image: options.image,
    worksFor: options.worksFor?.map((w) => ({
      "@type": "Organization" as const,
      name: w.name,
      url: w.url,
    })),
    alumniOf: options.alumniOf?.map((a) => ({
      "@type": "EducationalOrganization" as const,
      name: a.name,
      url: a.url,
    })),
    award: options.award,
    knowsAbout: options.knowsAbout,
    sameAs: options.sameAs,
  };
}

interface FAQItem {
  question: string;
  answer: string;
}

export function createFAQJsonLd(items: FAQItem[]): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
