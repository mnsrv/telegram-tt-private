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

  it('should parse pre blocks with language', () => {
    const tokens: Token[] = [
      { type: 'pre_start', value: '```typescript\n', offset: 0, language: 'typescript' },
      { type: 'text', value: 'const x = 5;', offset: 13 },
      { type: 'pre_end', value: '```', offset: 24 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      {
        type: 'pre',
        content: [
          { type: 'text', content: 'const x = 5;', offset: 13, length: 12 }
        ],
        offset: 0,
        length: 27,
        language: 'typescript'
      }
    ]);
  });

  it('should parse pre blocks without language', () => {
    const tokens: Token[] = [
      { type: 'pre_start', value: '```\n', offset: 0 },
      { type: 'text', value: 'const x = 5;', offset: 4 },
      { type: 'pre_end', value: '```', offset: 15 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      {
        type: 'pre',
        content: [
          { type: 'text', content: 'const x = 5;', offset: 4, length: 12 }
        ],
        offset: 0,
        length: 18
      }
    ]);
  });

  it('should handle nested formatting in pre blocks', () => {
    const tokens: Token[] = [
      { type: 'pre_start', value: '```typescript\n', offset: 0, language: 'typescript' },
      { type: 'text', value: 'const x = ', offset: 13 },
      { type: 'bold_start', value: '**', offset: 22 },
      { type: 'text', value: '5', offset: 24 },
      { type: 'bold_end', value: '**', offset: 25 },
      { type: 'text', value: ';', offset: 27 },
      { type: 'pre_end', value: '```', offset: 28 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      {
        type: 'pre',
        content: [
          { type: 'text', content: 'const x = ', offset: 13, length: 10 },
          {
            type: 'bold',
            content: [
              { type: 'text', content: '5', offset: 24, length: 1 }
            ],
            offset: 22,
            length: 5
          },
          { type: 'text', content: ';', offset: 27, length: 1 }
        ],
        offset: 0,
        length: 31,
        language: 'typescript'
      }
    ]);
  });

  it('should parse spoiler text', () => {
    const tokens: Token[] = [
      { type: 'spoiler_start', value: '||', offset: 0 },
      { type: 'text', value: 'hidden text', offset: 2 },
      { type: 'spoiler_end', value: '||', offset: 12 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      {
        type: 'spoiler',
        content: [
          { type: 'text', content: 'hidden text', offset: 2, length: 11 }
        ],
        offset: 0,
        length: 14
      }
    ]);
  });

  it('should parse nested formatting within spoilers', () => {
    const tokens: Token[] = [
      { type: 'spoiler_start', value: '||', offset: 0 },
      { type: 'text', value: 'hidden ', offset: 2 },
      { type: 'bold_start', value: '**', offset: 9 },
      { type: 'text', value: 'bold', offset: 11 },
      { type: 'bold_end', value: '**', offset: 15 },
      { type: 'text', value: ' text', offset: 17 },
      { type: 'spoiler_end', value: '||', offset: 22 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      {
        type: 'spoiler',
        content: [
          { type: 'text', content: 'hidden ', offset: 2, length: 7 },
          {
            type: 'bold',
            content: [
              { type: 'text', content: 'bold', offset: 11, length: 4 }
            ],
            offset: 9,
            length: 8
          },
          { type: 'text', content: ' text', offset: 17, length: 5 }
        ],
        offset: 0,
        length: 24
      }
    ]);
  });

  it('should handle unclosed spoiler tags', () => {
    const tokens: Token[] = [
      { type: 'spoiler_start', value: '||', offset: 0 },
      { type: 'text', value: 'text', offset: 2 }
    ];

    const result = parse(tokens);
    expect(result).toEqual([
      { type: 'text', content: '||', offset: 0, length: 2 },
      { type: 'text', content: 'text', offset: 2, length: 4 }
    ]);
  });
}); 