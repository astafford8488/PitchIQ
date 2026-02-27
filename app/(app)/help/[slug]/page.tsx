import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle } from "@/lib/help-articles";
import { MarkdownContent } from "@/components/ui/MarkdownContent";

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/help" className="text-sm text-[var(--muted)] hover:text-[var(--text)] mb-4 inline-block">
        ← Help
      </Link>
      <h1 className="text-2xl font-bold mb-2">{article.title}</h1>
      <p className="text-[var(--muted)] mb-6">{article.description}</p>
      <div className="prose prose-invert prose-sm">
        <MarkdownContent content={article.content} />
      </div>
    </div>
  );
}
