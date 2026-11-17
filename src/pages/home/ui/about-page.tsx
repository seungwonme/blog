import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import {
  type AboutLanguage,
  getAboutContent,
  getAllEntriesMeta,
} from "@/entities/post";
import { createFAQJsonLd, createWebPageJsonLd, JsonLd } from "@/shared/lib";
import { ABOUT_VERSIONS, getAboutUrl } from "../model/about";
import { HomePage } from "./home-page";

export function AboutPage({ language }: { language: AboutLanguage }) {
  const version = ABOUT_VERSIONS[language];
  const otherLanguage = language === "ko" ? "en" : "ko";
  const otherVersion = ABOUT_VERSIONS[otherLanguage];
  const aboutContent = getAboutContent(language);

  return (
    <div lang={language}>
      <JsonLd
        data={createWebPageJsonLd({
          title: "About - Aiden Ahn",
          description: version.description,
          url: getAboutUrl(language),
          inLanguage: version.locale.replace("_", "-"),
        })}
      />
      <JsonLd data={createFAQJsonLd(version.faq)} />
      {/* Render a crawlable copy of the profile before the terminal runs. */}
      <div className="sr-only">
        <article>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {aboutContent}
          </ReactMarkdown>
        </article>
        <section>
          <h2>Frequently Asked Questions</h2>
          {version.faq.map((item) => (
            <div key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>
      </div>
      <HomePage
        posts={getAllEntriesMeta()}
        aboutContent={aboutContent}
        aboutPath={version.path}
        initialCommand="about"
        headerAction={
          <Link
            href={otherVersion.path}
            hrefLang={otherLanguage}
            lang={otherLanguage}
            className="shrink-0 rounded px-1.5 py-1 text-xs text-ctp-sapphire underline underline-offset-2 hover:text-ctp-sky focus-visible:outline-2"
          >
            {otherVersion.label}
          </Link>
        }
      />
    </div>
  );
}
