export type TokenType = 
  | 'text'
  | 'bold_start' 
  | 'bold_end'
  | 'italic_start'
  | 'italic_end'
  | 'code_start'
  | 'code_end';

export interface Token {
  type: TokenType;
  value: string;
  offset: number;
}

const TOKENS = {
  BOLD: /\*\*/,
  ITALIC: /__/,
  CODE: /`/,
} as const;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let currentOffset = 0;
  const openTokens = new Map<string, number>();

  while (text.length > 0) {
    let matched = false;

    // Check for markdown tokens
    for (const [type, pattern] of Object.entries(TOKENS)) {
      const match = text.match(pattern);
      if (match && match.index === 0) {
        const tokenType = type.toLowerCase();
        const isEnd = openTokens.has(tokenType);
        
        tokens.push({
          type: `${tokenType}_${isEnd ? 'end' : 'start'}` as TokenType,
          value: match[0],
          offset: currentOffset,
        });

        if (isEnd) {
          openTokens.delete(tokenType);
        } else {
          openTokens.set(tokenType, tokens.length - 1);
        }

        text = text.slice(match[0].length);
        currentOffset += match[0].length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Handle regular text (including newlines) as is
      if (tokens.length === 0 || tokens[tokens.length - 1].type !== 'text') {
        tokens.push({
          type: 'text',
          value: text[0],
          offset: currentOffset,
        });
      } else {
        tokens[tokens.length - 1].value += text[0];
      }
      text = text.slice(1);
      currentOffset += 1;
    }
  }

  return tokens;
}
