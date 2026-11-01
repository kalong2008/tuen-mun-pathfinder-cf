import { h } from "hastscript";
import type { Root } from "mdast";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkAbbr from "@syenchuk/remark-abbr";
import remarkDefinitionList from "remark-definition-list";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";

const ALERT_CLASS_BY_NAME: Record<string, string> = {
  note: "honor-alert honor-alert-note",
  warning: "honor-alert honor-alert-warning",
  tip: "honor-alert honor-alert-tip",
};

/** `:12` and `:3-9` are bible verses, but remark-directive parses them as text directives. */
const BIBLE_VERSE_DIRECTIVE_NAME = /^\d+(?:-\d+)?$/;

function remarkRestoreBibleVerseColons() {
  return (tree: Root) => {
    visit(tree, "textDirective", (node, index, parent) => {
      if (!parent || index === undefined || !BIBLE_VERSE_DIRECTIVE_NAME.test(node.name)) {
        return;
      }

      parent.children[index] = {
        type: "text",
        value: `:${node.name}`,
      };
    });
  };
}

function remarkDirectiveAlerts() {
  return (tree: Root) => {
    visit(tree, (node) => {
      if (
        (node.type === "containerDirective" ||
          node.type === "leafDirective" ||
          node.type === "textDirective") &&
        "name" in node &&
        typeof node.name === "string" &&
        ALERT_CLASS_BY_NAME[node.name]
      ) {
        const data = node.data ?? (node.data = {});
        const hast = h("div", { className: ALERT_CLASS_BY_NAME[node.name] });
        data.hName = hast.tagName;
        data.hProperties = hast.properties;
      }
    });
  };
}

function remarkYoutubeEmbeds() {
  return (tree: Root) => {
    visit(tree, "image", (node, index, parent) => {
      if (!parent || index === undefined || !node.url?.startsWith("youtube:")) {
        return;
      }

      const videoId = node.url.slice("youtube:".length).trim();
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        return;
      }

      parent.children[index] = {
        type: "html",
        value: `<div class="honor-youtube"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="${(node.alt?.trim() || "YouTube video").replace(/"/g, "&quot;")}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`,
      };
    });
  };
}

export const honorRemarkPlugins = [
  remarkGfm,
  remarkMath,
  remarkDefinitionList,
  remarkAbbr,
  remarkDirective,
  remarkRestoreBibleVerseColons,
  remarkDirectiveAlerts,
  remarkYoutubeEmbeds,
];

export const honorRehypePlugins = [rehypeRaw, rehypeKatex, rehypeHighlight];
