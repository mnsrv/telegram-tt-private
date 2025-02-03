export type MarkdownNodeType =
  | 'text'
  | 'bold'
  | 'italic'
  | 'code'
  | 'pre'
  | 'strike'
  | 'spoiler';

export interface MarkdownNode {
  type: MarkdownNodeType;
  content: string | MarkdownNode[];
  offset: number;
  length: number;
}

export interface MarkdownText extends MarkdownNode {
  type: 'text';
  content: string;
}

export interface MarkdownFormatted extends MarkdownNode {
  type: Exclude<MarkdownNodeType, 'text'>;
  content: MarkdownNode[];
}
