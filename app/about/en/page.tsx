import { AboutPage, getAboutMetadata } from "@/pages/home";

export const metadata = getAboutMetadata("en");

export default function EnglishAboutPage() {
  return <AboutPage language="en" />;
}
