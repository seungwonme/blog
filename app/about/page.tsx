import { AboutPage, getAboutMetadata } from "@/pages/home";

export const metadata = getAboutMetadata("ko");

export default function KoreanAboutPage() {
  return <AboutPage language="ko" />;
}
