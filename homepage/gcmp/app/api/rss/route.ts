import { posts } from "@/lib/posts";
import { Feed } from "feed";
import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const feed = new Feed({
    title: "Garden Computing Blog",
    description: "News from Garden Computing",
    id: baseUrl,
    link: baseUrl,
    language: "en",
    image: `${baseUrl}/social-image.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `${new Date().getFullYear()} Garden Computing, Inc.`,
  });

  posts.forEach((post) => {
    feed.addItem({
      title: post.meta.title,
      description: post.meta.subtitle,
      id: post.meta.slug,
      link: `${baseUrl}/news/${post.meta.slug}`,
      date: new Date(post.meta.date),
      author: [{ name: post.meta.author.name }],
      guid: post.meta.slug,
      image: `${baseUrl}${post.meta.coverImage}`,
    });
  });

  return new NextResponse(feed.rss2(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
