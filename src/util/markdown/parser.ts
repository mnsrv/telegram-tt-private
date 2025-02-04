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
} as const;

export function parse(tokens: Token[]): MarkdownNode[] {
  const state: ParserState = {
    nodes: [],
    stack: [],
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'text') {
      const textNode: MarkdownText = {
        type: 'text',
        content: token.value,
        offset: token.offset,
        length: token.value.length,
      };

      if (state.stack.length > 0) {
        state.stack[state.stack.length - 1].children.push(textNode);
      } else {
        state.nodes.push(textNode);
      }
      continue;
    }

    // Handle formatting tokens
    if (token.type.endsWith('_start')) {
      state.stack.push({
        type: token.type,
        startToken: token,
        children: [],
      });
      continue;
    }

    if (token.type.endsWith('_end')) {
      const startType = token.type.replace('_end', '_start') as TokenType;
      const stackItem = state.stack.pop();

      if (!stackItem || stackItem.type !== startType) {
        // Handle mismatched tags - convert both the start tag and content to text
        if (stackItem) {
          // First add the original start token as text
          const startTextNode: MarkdownText = {
            type: 'text',
            content: stackItem.startToken.value,
            offset: stackItem.startToken.offset,
            length: stackItem.startToken.value.length,
          };
          state.nodes.push(startTextNode);
          
          // Then add all accumulated children as top-level nodes
          state.nodes.push(...stackItem.children);
        }
        
        // Finally add the mismatched end token as text
        const textNode: MarkdownText = {
          type: 'text',
          content: token.value,
          offset: token.offset,
          length: token.value.length,
        };
        state.nodes.push(textNode);
        
        continue;
      }

      const formattedNode: MarkdownFormatted = {
        type: START_TO_NODE_TYPE[startType] as Exclude<MarkdownNodeType, 'text'>,
        content: stackItem.children,
        offset: stackItem.startToken.offset,
        length: (token.offset + token.value.length) - stackItem.startToken.offset,
      };

      if (state.stack.length > 0) {
        state.stack[state.stack.length - 1].children.push(formattedNode);
      } else {
        state.nodes.push(formattedNode);
      }
    }
  }

  // Handle any remaining open tags
  while (state.stack.length > 0) {
    const stackItem = state.stack.pop()!;
    const textNode: MarkdownText = {
      type: 'text',
      content: stackItem.startToken.value,
      offset: stackItem.startToken.offset,
      length: stackItem.startToken.value.length,
    };

    // Add any accumulated children as separate nodes
    if (state.stack.length > 0) {
      state.stack[state.stack.length - 1].children.push(textNode, ...stackItem.children);
    } else {
      state.nodes.push(textNode, ...stackItem.children);
    }
  }

  return state.nodes;
}
