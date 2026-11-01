import authoringSample from "./authoring-sample.md?raw";
import styleSample from "./style-sample.md?raw";

export const MARKDOWN_STYLE_SAMPLE_PLACEHOLDER = "{{MARKDOWN_STYLE_SAMPLE}}";
export const HONOR_AUTHORING_SAMPLE_PLACEHOLDER = "{{HONOR_AUTHORING_SAMPLE}}";

export function expandHonorMarkdownPlaceholders(markdown: string): string {
  return markdown
    .split(HONOR_AUTHORING_SAMPLE_PLACEHOLDER)
    .join(authoringSample.trim())
    .split(MARKDOWN_STYLE_SAMPLE_PLACEHOLDER)
    .join(styleSample.trim());
}
