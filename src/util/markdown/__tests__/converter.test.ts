import { convertToFormattedText } from '../converter';
import type { MarkdownNode } from '../types';
import { ApiMessageEntityTypes } from '../../../api/types';

describe('markdown converter', () => {
  it('should convert plain text', () => {
    const ast: MarkdownNode[] = [
      { type: 'text', content: 'Hello world', offset: 0, length: 11 }
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'Hello world',
      entities: undefined
    });
  });

  it('should convert bold text', () => {
    const ast: MarkdownNode[] = [
      {
        type: 'bold',
        content: [
          { type: 'text', content: 'bold', offset: 2, length: 4 }
        ],
        offset: 0,
        length: 8
      }
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'bold',
      entities: [{
        type: ApiMessageEntityTypes.Bold,
        offset: 0,
        length: 4
      }]
    });
  });

  it('should convert italic text', () => {
    const ast: MarkdownNode[] = [
      {
        type: 'italic',
        content: [
          { type: 'text', content: 'italic', offset: 2, length: 6 }
        ],
        offset: 0,
        length: 10
      }
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'italic',
      entities: [{
        type: ApiMessageEntityTypes.Italic,
        offset: 0,
        length: 6
      }]
    });
  });

  it('should convert code', () => {
    const ast: MarkdownNode[] = [
      {
        type: 'code',
        content: [
          { type: 'text', content: 'code', offset: 1, length: 4 }
        ],
        offset: 0,
        length: 6
      }
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'code',
      entities: [{
        type: ApiMessageEntityTypes.Code,
        offset: 0,
        length: 4
      }]
    });
  });

  it('should convert mixed text with formatting', () => {
    const ast: MarkdownNode[] = [
      { type: 'text', content: 'Hello ', offset: 0, length: 6 },
      {
        type: 'bold',
        content: [
          { type: 'text', content: 'bold', offset: 8, length: 4 }
        ],
        offset: 6,
        length: 8
      },
      { type: 'text', content: ' world', offset: 14, length: 6 }
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'Hello bold world',
      entities: [{
        type: ApiMessageEntityTypes.Bold,
        offset: 6,
        length: 4
      }]
    });
  });

  it('should convert nested formatting', () => {
    const ast: MarkdownNode[] = [
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
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'bold italic',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 0,
          length: 11
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 5,
          length: 6
        }
      ]
    });
  });

  it('should handle empty AST', () => {
    expect(convertToFormattedText([])).toEqual({
      text: '',
      entities: undefined
    });
  });

  it('should convert pre blocks with language', () => {
    const ast: MarkdownNode[] = [
      {
        type: 'pre',
        content: [
          { type: 'text', content: 'const x = 5;', offset: 13, length: 12 }
        ],
        offset: 0,
        length: 27,
        language: 'typescript'
      }
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'const x = 5;',
      entities: [{
        type: ApiMessageEntityTypes.Pre,
        offset: 0,
        length: 12,
        language: 'typescript'
      }]
    });
  });

  it('should convert pre blocks without language', () => {
    const ast: MarkdownNode[] = [
      {
        type: 'pre',
        content: [
          { type: 'text', content: 'const x = 5;', offset: 4, length: 12 }
        ],
        offset: 0,
        length: 18
      }
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'const x = 5;',
      entities: [{
        type: ApiMessageEntityTypes.Pre,
        offset: 0,
        length: 12
      }]
    });
  });

  it('should convert nested formatting in pre blocks', () => {
    const ast: MarkdownNode[] = [
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
    ];

    expect(convertToFormattedText(ast)).toEqual({
      text: 'const x = 5;',
      entities: [
        {
          type: ApiMessageEntityTypes.Pre,
          offset: 0,
          length: 12,
          language: 'typescript'
        },
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 10,
          length: 1
        }
      ]
    });
  });
}); 