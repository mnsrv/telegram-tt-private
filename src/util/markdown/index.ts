import type { ApiFormattedText } from '../../api/types';
import { tokenize } from './tokenizer';
import { parse } from './parser';
import { convertToFormattedText } from './converter';

export function parseMarkdown(text: string): ApiFormattedText {
  // Handle empty input early
  if (!text) {
    return {
      text: '',
      entities: undefined
    };
  }

  try {
    // Step 1: Convert markdown text to tokens
    const tokens = tokenize(text);

    // Step 2: Parse tokens into AST
    const ast = parse(tokens);

    // Step 3: Convert AST to formatted text
    return convertToFormattedText(ast);
  } catch (error) {
    // If anything fails, return the original text without formatting
    return {
      text,
      entities: undefined
    };
  }
} 