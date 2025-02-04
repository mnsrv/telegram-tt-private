import { parse } from '../parser';
import type { Token } from '../tokenizer';
import type { MarkdownNode } from '../types';

describe('markdown parser', () => {
  it('should parse plain text', () => {
    const tokens: Token[] = [
      { type: 'text', value: 'Hello world', offset: 0 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      { type: 'text', content: 'Hello world', offset: 0, length: 11 }
    ]);
  });

  it('should parse bold text', () => {
    const tokens: Token[] = [
      { type: 'bold_start', value: '**', offset: 0 },
      { type: 'text', value: 'bold', offset: 2 },
      { type: 'bold_end', value: '**', offset: 6 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      {
        type: 'bold',
        content: [
          { type: 'text', content: 'bold', offset: 2, length: 4 }
        ],
        offset: 0,
        length: 8
      }
    ]);
  });

  it('should parse nested formatting', () => {
    const tokens: Token[] = [
      { type: 'bold_start', value: '**', offset: 0 },
      { type: 'text', value: 'bold ', offset: 2 },
      { type: 'italic_start', value: '__', offset: 7 },
      { type: 'text', value: 'italic', offset: 9 },
      { type: 'italic_end', value: '__', offset: 15 },
      { type: 'bold_end', value: '**', offset: 17 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      {
        type: 'bold',
        content: [
          { type: 'text', content: 'bold ', offset: 2, length: 5 },
          {
            type: 'italic',
            content: [
              { type: 'text', content: 'italic', offset: 9, length: 6 }
            ],
            offset: 7,
            length: 10
          }
        ],
        offset: 0,
        length: 19
      }
    ]);
  });

  it('should handle mismatched tags', () => {
    const tokens: Token[] = [
      { type: 'bold_start', value: '**', offset: 0 },
      { type: 'text', value: 'text', offset: 2 },
      { type: 'italic_end', value: '__', offset: 6 } // Mismatched end tag
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      { type: 'text', content: '**', offset: 0, length: 2 },
      { type: 'text', content: 'text', offset: 2, length: 4 },
      { type: 'text', content: '__', offset: 6, length: 2 }
    ]);
  });

  it('should handle empty input', () => {
    const tokens: Token[] = [];
    const result = parse(tokens);
    expect(result).toEqual([]);
  });

  it('should handle unclosed tags', () => {
    const tokens: Token[] = [
      { type: 'bold_start', value: '**', offset: 0 },
      { type: 'text', value: 'text', offset: 2 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      { type: 'text', content: '**', offset: 0, length: 2 },
      { type: 'text', content: 'text', offset: 2, length: 4 }
    ]);
  });

  it('should parse code blocks', () => {
    const tokens: Token[] = [
      { type: 'code_start', value: '`', offset: 0 },
      { type: 'text', value: 'code', offset: 1 },
      { type: 'code_end', value: '`', offset: 5 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      {
        type: 'code',
        content: [
          { type: 'text', content: 'code', offset: 1, length: 4 }
        ],
        offset: 0,
        length: 6
      }
    ]);
  });
}); 