import DocsLayout from "@/app/docs/[framework]/(others)/layout";
import { TableOfContents } from "@/components/docs/TableOfContents";
import ComingSoonPage from "@/components/docs/coming-soon.mdx";
import { docNavigationItems } from "@/lib/docNavigationItems";
import { Framework, frameworks } from "@/lib/framework";
import type { Toc } from "@stefanprobst/rehype-extract-toc";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { Metadata } from "next";

async function getMdxSource(slugPath: string, framework: string) {
  try {
    return await import(`./${slugPath}.mdx`);
  } catch (error) {
    return await import(`./${slugPath}/${framework}.mdx`);
  }
}

export async function generateMetadata({
  params: { slug, framework },
}: {
  params: { slug: string[]; framework: string };
}): Promise<Metadata> {
  const slugPath = slug.join("/");
  const title = "Coming soon";
  try {
    const mdxSource = await getMdxSource(slugPath, framework);
    const title = mdxSource.metadata.title;

    return {
      title,
      openGraph: {
        title,
      },
    };
  } catch (error) {
    return {
      title,
      openGraph: {
        title,
      },
    };
  }
}

export default async function Page({
  params: { slug, framework },
}: { params: { slug: string[]; framework: string } }) {
  const slugPath = slug.join("/");

  try {
    const mdxSource = await getMdxSource(slugPath, framework);
    const { default: Content, tableOfContents } = mdxSource;

    // Exclude h1 from table of contents
    const tocItems = (tableOfContents as Toc)?.[0]?.children;

    return (
      <>
        <Prose className="overflow-x-hidden lg:flex-1 py-8">
          <Content />
        </Prose>
        {tocItems && <TableOfContents items={tocItems} />}
      </>
    );
  } catch (error) {
    return (
      <DocsLayout>
        <ComingSoonPage />
      </DocsLayout>
    );
  }
}

// https://nextjs.org/docs/app/api-reference/functions/generate-static-params
export const dynamicParams = false;
export const dynamic = "force-static";

export async function generateStaticParams() {
  const paths: Array<{ slug?: string[]; framework: Framework }> = [];

  for (const framework of frameworks) {
    for (const heading of docNavigationItems) {
      for (const item of heading?.items) {
        if (item.href && item.href.startsWith("/docs")) {
          const slug = item.href
            .replace("/docs", "")
            .split("/")
            .filter(Boolean);
          if (slug.length) {
            paths.push({
              slug,
              framework,
            });
          }
        }
      }
    }
  }

  return paths;
}
