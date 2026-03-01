import ReactMarkdown from "react-markdown";

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1a1a1a] prose-pre:rounded-lg prose-code:text-zinc-300">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
