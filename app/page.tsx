import { getPosts } from "@/entities/post";
import { HomePage } from "@/pages/home";
import { createPersonJsonLd, JsonLd } from "@/shared/lib";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seunan.dev";

export default function Page() {
  const posts = getPosts();
  return (
    <>
      <JsonLd
        data={createPersonJsonLd({
          name: "Aiden Ahn",
          url: SITE_URL,
          jobTitle: "Software Engineer & Co-founder",
          worksFor: {
            name: "대모산개발단 (DemoDev)",
            url: "https://demodev.io",
          },
          sameAs: ["https://github.com/seungwonme"],
        })}
      />
      <HomePage posts={posts} />
    </>
  );
}
