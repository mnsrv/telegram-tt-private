import { parseMarkdown } from '../index';
import { ApiMessageEntityTypes } from '../../../api/types';

describe('markdown parser', () => {
  it('should parse plain text', () => {
    const input = 'Hello world';
    
    expect(parseMarkdown(input)).toEqual({
      text: 'Hello world',
      entities: undefined
    });
  });

  it('should parse bold text', () => {
    const input = 'Hello **world**';
    
    expect(parseMarkdown(input)).toEqual({
      text: 'Hello world',
      entities: [{
        type: ApiMessageEntityTypes.Bold,
        offset: 6,
        length: 5
      }]
    });
  });

  it('should parse italic text', () => {
    const input = 'Hello __world__';
    
    expect(parseMarkdown(input)).toEqual({
      text: 'Hello world',
      entities: [{
        type: ApiMessageEntityTypes.Italic,
        offset: 6,
        length: 5
      }]
    });
  });

  it('should parse code', () => {
    const input = '`code`';
    
    expect(parseMarkdown(input)).toEqual({
      text: 'code',
      entities: [{
        type: ApiMessageEntityTypes.Code,
        offset: 0,
        length: 4
      }]
    });
  });

  it('should parse mixed formatting', () => {
    const input = 'Hello **bold** and __italic__';
    
    expect(parseMarkdown(input)).toEqual({
      text: 'Hello bold and italic',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 6,
          length: 4
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 15,
          length: 6
        }
      ]
    });
  });

  it('should parse nested formatting', () => {
    const input = '**bold __italic__ text**';
    
    expect(parseMarkdown(input)).toEqual({
      text: 'bold italic text',
      entities: [
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 0,
          length: 16
        },
        {
          type: ApiMessageEntityTypes.Italic,
          offset: 5,
          length: 6
        }
      ]
    });
  });

  it('should handle empty input', () => {
    expect(parseMarkdown('')).toEqual({
      text: '',
      entities: undefined
    });
  });

  it('should handle mismatched tags', () => {
    const input = '**bold text';
    
    expect(parseMarkdown(input)).toEqual({
      text: '**bold text',
      entities: undefined
    });
  });

  it('should handle multiple paragraphs', () => {
    const input = 'First line\nSecond **bold** line';
    
    expect(parseMarkdown(input)).toEqual({
      text: 'First line\nSecond bold line',
      entities: [{
        type: ApiMessageEntityTypes.Bold,
        offset: 18,
        length: 4
      }]
    });
  });

  it('should parse spoiler text correctly', () => {
    const input = 'This is ||hidden text|| and this is visible.';
    const result = parseMarkdown(input);
    expect(result).toEqual({
      text: 'This is hidden text and this is visible.',
      entities: [{
        type: ApiMessageEntityTypes.Spoiler,
        offset: 8,
        length: 11
      }]
    });
  });

  it('should parse nested formatting within spoilers correctly', () => {
    const input = 'Secret: ||hidden **bold** text||';
    const result = parseMarkdown(input);
    expect(result).toEqual({
      text: 'Secret: hidden bold text',
      entities: [
        {
          type: ApiMessageEntityTypes.Spoiler,
          offset: 8,
          length: 16
        },
        {
          type: ApiMessageEntityTypes.Bold,
          offset: 15,
          length: 4
        }
      ]
    });
  });

  it('should handle unclosed spoiler tags correctly', () => {
    const input = 'This is ||unclosed text';
    const result = parseMarkdown(input);
    expect(result).toEqual({
      text: 'This is ||unclosed text',
      entities: undefined
    });
  });
}); 