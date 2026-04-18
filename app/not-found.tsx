import { getAboutContent, getAllEntriesMeta } from "@/entities/post";
import { HomePage } from "@/pages/home";

export default function NotFound() {
  const posts = getAllEntriesMeta();
  const aboutContent = getAboutContent();
  return (
    <HomePage posts={posts} aboutContent={aboutContent} initialCommand="404" />
  );
}
