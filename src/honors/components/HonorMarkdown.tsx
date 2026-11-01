import Markdown from "react-markdown";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";
import { defListHastHandlers } from "remark-definition-list";

import {
  honorRemarkPlugins,
  honorRehypePlugins,
} from "../lib/markdown/plugins";
import { honorMarkdownClassName, linkifyHonorMarkdown } from "../lib/markdown/honor-markdown";

export function HonorMarkdown({ markdown }: { markdown: string }) {
  const content = linkifyHonorMarkdown(markdown);

  return (
    <div className={honorMarkdownClassName}>
      <Markdown
        remarkPlugins={honorRemarkPlugins}
        rehypePlugins={honorRehypePlugins}
        remarkRehypeOptions={{
          handlers: defListHastHandlers,
        }}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
