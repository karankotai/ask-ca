import ReactMarkdown from "react-markdown";

type MarkdownProps = {
  content: string;
  variant?: "light" | "dark";
};

export default function Markdown({ content, variant = "light" }: MarkdownProps) {
  if (variant === "dark") {
    return (
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1a1a1a] prose-pre:rounded-lg prose-code:text-zinc-300">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }
  return (
    <div className="prose max-w-none prose-p:leading-relaxed prose-headings:text-zinc-900 prose-p:text-zinc-700 prose-a:text-indigo-600 prose-strong:text-zinc-900 prose-pre:bg-zinc-50 prose-pre:border prose-pre:border-zinc-200 prose-pre:rounded-lg prose-code:text-zinc-700 prose-blockquote:border-l-indigo-500 prose-blockquote:text-zinc-600">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
