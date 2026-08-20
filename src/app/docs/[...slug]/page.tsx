import { notFound } from 'next/navigation';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { getAllDocs, getDocBySlug } from '@/lib/docs';
import { getSidebarNav } from '@/lib/sidebar';
import { extractHeadings } from '@/lib/toc';
import { Mdx } from '@/components/mdx-components';
import Breadcrumb from '@/components/bread-crumb';
import Toc from '@/components/toc';

type tParams = Promise<{ slug: string[] }>;

export const generateStaticParams = async () => {
  return getAllDocs().map((doc) => {
    // For a path like "getting-started/introduction",
    // this creates { slug: ['getting-started', 'introduction'] }
    return { slug: doc.slug.split('/') };
  });
};

export const generateMetadata = async ({ params }: { params: tParams }) => {
  // Join the slug array back into a path string
  const awaitedParams = await params;
  const path = awaitedParams.slug.join('/');
  const doc = getDocBySlug(path);

  if (!doc) notFound();
  return {
    title: doc.title,
    description: doc.description || 'A detailed guide to the topic.',
    openGraph: {
      title: doc.title,
      description: doc.description || 'A detailed guide to the topic.',
    },
  };
};

const DocsPage = async ({ params }: { params: tParams }) => {
  const awaitedParams = await params;
  // Join the slug array back into a path string
  const path = awaitedParams.slug.join('/');
  const doc = getDocBySlug(path);

  if (!doc) notFound();

  const source = await serialize(doc.raw, {
    // Docs are trusted local files; allow JSX expressions (component props
    // like `tabs={{ ... }}`) which next-mdx-remote strips by default.
    blockJS: false,
    mdxOptions: {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeSlug, rehypeHighlight],
    },
  });

  const tocItems = extractHeadings(doc.raw);

  const section = getSidebarNav().sections.find((s) =>
    s.pages.some((p) => p.href === doc.url)
  );

  return (
    <div
      className={
        tocItems.length > 0 ? 'grid xl:grid xl:grid-cols-[1fr_270px]' : ''
      }
    >
      <article className="overflow-auto">
        {section && (
          <div className="mb-8 text-center">
            <Breadcrumb sectionTitle={section.title} pageTitle={doc.title} />
          </div>
        )}
        <Mdx source={source} />
      </article>

      <Toc key={doc.url} items={tocItems} />
    </div>
  );
};

export default DocsPage;
