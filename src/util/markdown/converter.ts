import type { ApiFormattedText, ApiMessageEntity } from '../../api/types';
import { ApiMessageEntityTypes } from '../../api/types';
import type { MarkdownNode, MarkdownNodeType } from './types';

const NODE_TYPE_TO_ENTITY: Record<Exclude<MarkdownNodeType, 'text'>, ApiMessageEntityTypes> = {
  bold: ApiMessageEntityTypes.Bold,
  italic: ApiMessageEntityTypes.Italic,
  code: ApiMessageEntityTypes.Code,
  pre: ApiMessageEntityTypes.Pre,
  strike: ApiMessageEntityTypes.Strike,
  spoiler: ApiMessageEntityTypes.Spoiler,
};

interface ConversionState {
  text: string;
  entities: ApiMessageEntity[];
  offset: number;
}

function processNode(node: MarkdownNode, state: ConversionState): void {
  if (node.type === 'text') {
    state.text += node.content;
    state.offset += node.content.length;
    return;
  }

  const startOffset = state.offset;
  
  if (Array.isArray(node.content)) {
    // Add entity before processing children
    const entityIndex = state.entities.length;
    state.entities.push({
      type: NODE_TYPE_TO_ENTITY[node.type],
      offset: startOffset,
      length: 0,  // Will update after processing children
    } as ApiMessageEntity);
    
    // Process all child nodes
    node.content.forEach((child) => processNode(child, state));
    
    // Update entity length using stored index
    state.entities[entityIndex].length = state.offset - startOffset;
  }
}

export function convertToFormattedText(ast: MarkdownNode[]): ApiFormattedText {
  const state: ConversionState = {
    text: '',
    entities: [],
    offset: 0,
  };

  ast.forEach((node) => processNode(node, state));

  return {
    text: state.text,
    entities: state.entities.length > 0 ? state.entities : undefined,
  };
} 