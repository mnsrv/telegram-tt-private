import type { Token, TokenType } from './tokenizer';
import type { MarkdownNode, MarkdownText, MarkdownFormatted, MarkdownNodeType } from './types';

interface ParserState {
  nodes: MarkdownNode[];
  stack: {
    type: TokenType;
    startToken: Token;
    children: MarkdownNode[];
  }[];
}

const START_TO_NODE_TYPE: Partial<Record<TokenType, MarkdownNodeType>> = {
  bold_start: 'bold',
  italic_start: 'italic',
  code_start: 'code',
  pre_start: 'pre',
  spoiler_start: 'spoiler',
  strike_start: 'strike',
} as const;

export function parse(tokens: Token[]): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  const stack: { type: string, startToken: Token, nodes: MarkdownNode[] }[] = [];
  let currentNodes = nodes;

  for (const token of tokens) {
    if (token.type.endsWith('_start')) {
      // Extract base type (e.g., 'bold_start' -> 'bold')
      const type = token.type.slice(0, -6);
      
      // Create new formatting context
      const context = {
        type,
        startToken: token,
        nodes: []
      };
      
      stack.push(context);
      currentNodes = context.nodes;
      continue;
    }

    if (token.type.endsWith('_end')) {
      const type = token.type.slice(0, -4);
      const context = stack.pop();

      if (!context || context.type !== type) {
        // Handle mismatched tags - treat them as text
        if (context) {
          stack.push(context);
          currentNodes = context.nodes;
        } else {
          currentNodes = nodes;
        }
        currentNodes.push({
          type: 'text',
          content: token.value,
          offset: token.offset,
          length: token.value.length
        });
        continue;
      }

      // Create formatting node with collected content
      const node: MarkdownNode = {
        type: type as MarkdownNodeType,
        content: context.nodes,
        offset: context.startToken.offset,
        length: (token.offset + token.value.length) - context.startToken.offset,
        ...(type === 'pre' && context.startToken.language ? { language: context.startToken.language } : {})
      };

      // Add to parent context
      currentNodes = stack.length > 0 ? stack[stack.length - 1].nodes : nodes;
      currentNodes.push(node);
      continue;
    }

    // Text tokens
    currentNodes.push({
      type: 'text',
      content: token.value,
      offset: token.offset,
      length: token.value.length
    });
  }

  // Handle unclosed tags
  while (stack.length > 0) {
    const context = stack.pop()!;
    // Convert start token to text
    nodes.unshift({
      type: 'text',
      content: context.startToken.value,
      offset: context.startToken.offset,
      length: context.startToken.value.length
    });
    // Add collected nodes
    nodes.push(...context.nodes);
  }

  return nodes;
}
