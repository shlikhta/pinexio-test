import { notFound } from 'next/navigation';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { getAllDocs, getDocBySlug } from '@/lib/docs';
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

  if (!doc) throw new Error(`Doc not found for slug: ${path}`);
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

  return (
    <div
      className={
        tocItems.length > 0 ? 'grid xl:grid xl:grid-cols-[1fr_270px]' : ''
      }
    >
      <article className="overflow-auto">
        <div className="mb-8 text-center">
          <Breadcrumb path={doc.url} />
        </div>
        <Mdx source={source} />
      </article>

      <Toc items={tocItems} />
    </div>
  );
};

export default DocsPage;
