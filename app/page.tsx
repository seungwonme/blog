import { getAboutContent, getAllEntriesMeta } from "@/entities/post";
import { HomePage } from "@/pages/home";
import { createBlogJsonLd, JsonLd } from "@/shared/lib";

export default function Page() {
  const posts = getAllEntriesMeta();
  const aboutContent = getAboutContent();
  return (
    <>
      <JsonLd data={createBlogJsonLd(posts)} />
      <HomePage posts={posts} aboutContent={aboutContent} />
    </>
  );
}
