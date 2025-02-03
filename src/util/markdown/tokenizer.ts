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

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let currentOffset = 0;
  let text = input;

  while (text.length > 0) {
    let matched = false;

    // Check for markdown tokens
    for (const [type, pattern] of Object.entries(TOKENS)) {
      const match = text.match(pattern);
      if (match && match.index === 0) {
        const tokenType = `${type.toLowerCase()}_${tokens.some(t => t.type === `${type.toLowerCase()}_start`) ? 'end' : 'start'}` as TokenType;
        tokens.push({
          type: tokenType,
          value: match[0],
          offset: currentOffset,
        });
        text = text.slice(match[0].length);
        currentOffset += match[0].length;
        matched = true;
        break;
      }
    }

    // If no token matched, consume one character as text
    if (!matched) {
      const char = text[0];
      if (tokens.length === 0 || tokens[tokens.length - 1].type !== 'text') {
        tokens.push({
          type: 'text',
          value: char,
          offset: currentOffset,
        });
      } else {
        tokens[tokens.length - 1].value += char;
      }
      text = text.slice(1);
      currentOffset += 1;
    }
  }

  return tokens;
}
