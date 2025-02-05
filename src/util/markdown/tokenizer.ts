export type TokenType = 
  | 'text'
  | 'bold_start' 
  | 'bold_end'
  | 'italic_start'
  | 'italic_end'
  | 'code_start'
  | 'code_end'
  | 'spoiler_start'
  | 'spoiler_end'
  | 'strike_start'
  | 'strike_end'
  | 'pre_start'
  | 'pre_end';

export interface Token {
  type: TokenType;
  value: string;
  offset: number;
  length?: number;  // Optional length for text tokens
  language?: string;  // Optional language for pre tokens
}

const TOKENS = {
  BOLD: /\*\*/,
  ITALIC: /__/,
  CODE: /`(?!``)/,  // Single backtick not followed by two more
  SPOILER: /\|\|/,
  STRIKE: /~~/,
  PRE_WITH_LANG: /^```(\w+)[\n\r](.*?)[\n\r]?```/ms,  // Code block with language
  PRE: /^```[\n\r]?(.*?)[\n\r]?```/ms,  // Code block without language
} as const;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let currentOffset = 0;
  const openTokens = new Map<string, number>();

  while (text.length > 0) {
    let matched = false;

    // Try to match code blocks first
    const preWithLangMatch = text.match(TOKENS.PRE_WITH_LANG);
    if (preWithLangMatch && preWithLangMatch.index === 0) {
      const [fullMatch, language, content] = preWithLangMatch;
      tokens.push({
        type: 'pre_start',
        value: '```' + language + '\n',
        offset: currentOffset,
        language,
      });
      tokens.push({
        type: 'text',
        value: content,
        offset: currentOffset + language.length + 4,  // 3 for ``` and 1 for \n
      });
      tokens.push({
        type: 'pre_end',
        value: '```',
        offset: currentOffset + fullMatch.length - 3,
      });
      text = text.slice(fullMatch.length);
      currentOffset += fullMatch.length;
      matched = true;
    } else {
      const preMatch = text.match(TOKENS.PRE);
      if (preMatch && preMatch.index === 0) {
        const [fullMatch, content] = preMatch;
        tokens.push({
          type: 'pre_start',
          value: '```\n',
          offset: currentOffset,
        });
        tokens.push({
          type: 'text',
          value: content,
          offset: currentOffset + 4,  // 3 for ``` and 1 for \n
        });
        tokens.push({
          type: 'pre_end',
          value: '```',
          offset: currentOffset + fullMatch.length - 3,
        });
        text = text.slice(fullMatch.length);
        currentOffset += fullMatch.length;
        matched = true;
      }
    }

    if (!matched) {
      // Check for other markdown tokens
      for (const [type, pattern] of Object.entries(TOKENS)) {
        if (type === 'PRE_WITH_LANG' || type === 'PRE') continue;  // Already handled
        const match = text.match(pattern);
        if (match && match.index === 0) {
          const tokenType = type.toLowerCase();
          const isEnd = openTokens.has(tokenType);
          
          // If we have an opening token followed immediately by a closing token,
          // treat them as plain text
          if (!isEnd) {
            // Look ahead to see if we have text followed by a closing token
            let pos = match[0].length;
            let textContent = '';
            let hasText = false;
            let foundClosingToken = false;
            let lastClosingTokenPos = -1;
            
            while (pos < text.length) {
              if (text.slice(pos).startsWith(match[0])) {
                foundClosingToken = true;
                lastClosingTokenPos = pos;
                pos += match[0].length;
                continue;
              }
              textContent += text[pos];
              hasText = true;
              pos++;
            }

            if (hasText && foundClosingToken) {
              // We found text followed by a closing token, handle as formatting
              tokens.push({
                type: `${tokenType}_start` as TokenType,
                value: match[0],
                offset: currentOffset,
              });
              openTokens.set(tokenType, tokens.length - 1);
              text = text.slice(match[0].length);
              currentOffset += match[0].length;
              matched = true;
              break;
            } else if (!hasText && text.slice(match[0].length).startsWith(match[0])) {
              // We found two consecutive markers with no text between,
              // treat them as plain text
              tokens.push({
                type: 'text',
                value: match[0] + match[0],
                offset: currentOffset,
                length: match[0].length * 2,
              });
              text = text.slice(match[0].length * 2);
              currentOffset += match[0].length * 2;
              matched = true;
              break;
            }
          }

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

  // Handle unclosed tokens - convert them to text
  if (openTokens.size > 0) {
    const newTokens: Token[] = [];
    let lastTextToken: Token | undefined;

    for (const token of tokens) {
      if (token.type === 'text') {
        if (lastTextToken) {
          lastTextToken.value += token.value;
          lastTextToken.length = lastTextToken.value.length;
        } else {
          lastTextToken = token;
          newTokens.push(token);
        }
      } else {
        const baseType = token.type.replace(/_start$|_end$/, '');
        if (openTokens.has(baseType)) {
          // Convert token to text
          if (lastTextToken) {
            lastTextToken.value += token.value;
            lastTextToken.length = lastTextToken.value.length;
          } else {
            lastTextToken = {
              type: 'text',
              value: token.value,
              offset: token.offset,
              length: token.value.length,
            };
            newTokens.push(lastTextToken);
          }
        } else {
          lastTextToken = undefined;
          newTokens.push(token);
        }
      }
    }

    return newTokens;
  }

  return tokens;
}
