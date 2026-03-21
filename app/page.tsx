import { getPosts } from "@/entities/post";
import { HomePage } from "@/pages/home";

export default function Page() {
  const posts = getPosts();
  return <HomePage posts={posts} />;
}
