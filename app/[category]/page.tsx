import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAboutContent,
  getAllEntriesMeta,
  getCategories,
  getEntriesByCategoryMeta,
} from "@/entities/post";
import { HomePage } from "@/pages/home";

interface Props {
  params: Promise<{ category: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.seunan.dev";

export const dynamicParams = false;

export function generateStaticParams() {
  return getCategories().map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = category.toLowerCase();
  const entries = getEntriesByCategoryMeta(cat);
  if (entries.length === 0) return {};

  const url = `${SITE_URL}/${cat}`;
  return {
    title: cat,
    description: `${cat} 카테고리의 글 ${entries.length}편`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${cat} — seunan.dev`,
      description: `${cat} 카테고리의 글 ${entries.length}편`,
      type: "website",
      url,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = category.toLowerCase();
  const entries = getEntriesByCategoryMeta(cat);
  if (entries.length === 0) notFound();

  const posts = getAllEntriesMeta();
  const aboutContent = getAboutContent();

  return (
    <>
      {/* SSR 링크 목록: 크롤러가 카테고리 글을 발견 (visually hidden) */}
      <nav className="sr-only" aria-label={`${cat} posts`}>
        <h1>{cat}</h1>
        <ul>
          {entries.map((entry) => (
            <li key={entry.slug}>
              <a href={`/${entry.category}/${entry.slug}`}>{entry.title}</a>
            </li>
          ))}
        </ul>
      </nav>
      {/* 터미널을 해당 카테고리 디렉토리에서 열고(prompt = ~/카테고리),
          현재 디렉토리를 ls 한다. 새로고침 시에도 경로가 보존된다. */}
      <HomePage
        posts={posts}
        aboutContent={aboutContent}
        initialPath={`~/${cat}`}
        initialCommand="ls"
      />
    </>
  );
}
