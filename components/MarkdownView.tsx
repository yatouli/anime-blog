import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { TocItem } from "@/lib/toc";

interface Props {
  content: string;
  /** 由页面用 extractHeadings 提取后传入，用于给标题加锚点 id（与 TOC 对应） */
  headings?: TocItem[];
}

export default function MarkdownView({ content, headings }: Props) {
  // 按渲染顺序给标题编号（与 extractHeadings 的文档顺序一致）
  let counter = -1;
  const nextId = () => {
    counter += 1;
    return headings?.[counter]?.id ?? `h-${counter}`;
  };

  const components = {
    h1: (props: React.ComponentProps<"h1">) => <h1 id={nextId()} {...props} />,
    h2: (props: React.ComponentProps<"h2">) => <h2 id={nextId()} {...props} />,
    h3: (props: React.ComponentProps<"h3">) => <h3 id={nextId()} {...props} />,
    h4: (props: React.ComponentProps<"h4">) => <h4 id={nextId()} {...props} />,
  };

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
