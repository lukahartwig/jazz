import { NewsletterCard } from "@/components/blog/NewsletterCard";
import { Posts } from "@/components/blog/Posts";
import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";

export const metadata = {
  title: "Blog",
};

export default function NewsPage() {
  return (
    <div className="container flex flex-col gap-10">
      <HeroHeader title="Blog" slogan="" />

      <Posts />

      <NewsletterCard />
    </div>
  );
}
