import { parseMarkdown as parseMarkdownAst } from '../index';
import { parseMarkdown as parseMarkdownRegexHtml } from '../../parseHtmlAsFormattedText';
import parseHtmlAsFormattedText from '../../parseHtmlAsFormattedText';
import { ApiMessageEntityTypes } from '../../../api/types';

describe('parseMarkdown implementations comparison', () => {
  function compareImplementations(input: string) {
    const astResult = parseMarkdownAst(input);
    // Convert regex result to formatted text
    const regexHtml = parseMarkdownRegexHtml(input);
    const regexResult = parseHtmlAsFormattedText(regexHtml, false, true);
    return { astResult, regexResult };
  }

  it('should handle basic formatting identically', () => {
    const inputs = [
      'Hello **bold** world',
      'Hello __italic__ world',
      'Hello `code` world',
      'Hello **bold __italic__** world',
      'Hello ```code block``` world',
    ];

    inputs.forEach((input) => {
      const { astResult, regexResult } = compareImplementations(input);
      expect(astResult).toEqual(regexResult);
    });
  });

  it('should handle nested formatting identically', () => {
    const inputs = [
      '**bold __italic__ text**',
      '__italic **bold** text__',
      '**bold `code` text**',
    ];

    inputs.forEach((input) => {
      const { astResult, regexResult } = compareImplementations(input);
      expect(astResult).toEqual(regexResult);
    });
  });

  it('should handle edge cases identically', () => {
    const inputs = [
      '', // Empty string
      '**', // Just markers
      '****', // Double markers
      '**bold', // Unclosed tag
      'bold**', // Unopened tag
      '**bold__italic**', // Mismatched tags
      'line1\nline2\nline3', // Multiple lines
    ];

    inputs.forEach((input) => {
      const { astResult, regexResult } = compareImplementations(input);
      expect(astResult).toEqual(regexResult);
    });
  });

  it('should handle code blocks with language identically', () => {
    const inputs = [
      '```typescript\nconst x = 5;\n```',
      '```python\ndef hello():\n    print("world")\n```',
    ];

    inputs.forEach((input) => {
      const { astResult, regexResult } = compareImplementations(input);
      expect(astResult).toEqual(regexResult);
    });
  });

  it('should handle spoiler text identically', () => {
    const inputs = [
      'Hello ||spoiler|| world',
      'Hello ||nested **bold**|| world',
    ];

    inputs.forEach((input) => {
      const { astResult, regexResult } = compareImplementations(input);
      expect(astResult).toEqual(regexResult);
    });
  });

  it('should handle strikethrough text identically', () => {
    const inputs = [
      'Hello ~~strikethrough~~ world',
      'Hello ~~nested **bold**~~ world',
    ];

    inputs.forEach((input) => {
      const { astResult, regexResult } = compareImplementations(input);
      expect(astResult).toEqual(regexResult);
    });
  });
}); 