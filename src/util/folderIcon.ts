import { ApiFormattedText, ApiMessageEntityTypes } from "../api/types";

export type FolderIconName = 'folder' | 'channel' | 'group' | 'chats' | 'user' | 'star' | 'chat' | 'bot';

export const FOLDER_EMOJI_MAP: Record<string, FolderIconName> = {
  // Users and Groups
  '👤': 'user',
  '👥': 'group',
  '👨‍💼': 'user',
  '👨‍💻': 'user',
  '💼': 'user',  // Work
  
  // Communication
  '📢': 'channel',
  '💬': 'chat',
  '✅': 'chat',
  '☑️': 'chat',
  'all-chats': 'chats',
  '🔔': 'chat',    // Unmuted
  '📈': 'chat',    // Trade
  
  // Bots and System
  '🤖': 'bot',
  
  // Special Categories
  '⭐': 'star',
  '👑': 'star',    // Crown
};

export const ALL_FOLDER_EMOJIS = [
  '🐱', '📕', '💰', '📸', '🎮', '🏡', '💡', '👍',
  '🔒', '❤️', '➕', '🎵', '🎨', '✈️', '⚽️', '⭐',
  '🎓', '🛫', '👨‍💼', '👤', '👥', '💬', '✅', '☑️',
  '🤖', '🗂'
];

export function getFolderIcon(emoticon: string | undefined): FolderIconName {
  if (!emoticon) return 'folder';
  return FOLDER_EMOJI_MAP[emoticon] || 'folder';
}

export function getDefaultFolderIcon(folder: {
  bots?: boolean;
  channels?: boolean;
  groups?: boolean;
  contacts?: boolean;
  nonContacts?: boolean;
  excludeMuted?: boolean;
  excludeRead?: boolean;
  includedChatIds?: string[];
  excludedChatIds?: string[];
}): FolderIconName {
  // If has specific included or excluded chats, use custom (folder) icon
  if ((folder.includedChatIds?.length || 0) > 0 || (folder.excludedChatIds?.length || 0) > 0) {
    return 'folder';
  }

  // Check if only contacts or non-contacts or both are selected
  const onlyContacts = folder.contacts && !folder.nonContacts && !folder.groups && !folder.channels && !folder.bots;
  const onlyNonContacts = !folder.contacts && folder.nonContacts && !folder.groups && !folder.channels && !folder.bots;
  const onlyPeople = folder.contacts && folder.nonContacts && !folder.groups && !folder.channels && !folder.bots;
  
  if (onlyContacts || onlyNonContacts || onlyPeople) {
    return 'user';
  }

  // Check for single type filters
  if (folder.groups && !folder.contacts && !folder.nonContacts && !folder.channels && !folder.bots) {
    return 'group';
  }
  if (folder.channels && !folder.contacts && !folder.nonContacts && !folder.groups && !folder.bots) {
    return 'channel';
  }
  if (folder.bots && !folder.contacts && !folder.nonContacts && !folder.groups && !folder.channels) {
    return 'bot';
  }

  // Check for read/mute states
  if (folder.excludeRead && !folder.excludeMuted) {
    return 'chat'; // For unread
  }
  if (folder.excludeMuted && !folder.excludeRead) {
    return 'chat'; // For unmuted
  }

  // Default case
  return 'folder';
}

export function getCustomEmojiFromTitle(title: ApiFormattedText) {
  if (!title.entities?.length) return undefined;

  // Check for emoji at the start
  const firstEntity = title.entities[0];
  if (firstEntity.type === ApiMessageEntityTypes.CustomEmoji && firstEntity.offset === 0) {
    return firstEntity;
  }

  // Check for emoji at the end
  const lastEntity = title.entities[title.entities.length - 1];
  if (lastEntity.type === ApiMessageEntityTypes.CustomEmoji && 
      lastEntity.offset + lastEntity.length === title.text.length) {
    return lastEntity;
  }

  return undefined;
}

export function removeCustomEmojiFromTitle(title: ApiFormattedText): ApiFormattedText {
  if (!title.entities?.length) return title;

  const customEmoji = getCustomEmojiFromTitle(title);
  if (!customEmoji) return title;

  // Remove the emoji from text and adjust entities
  const newText = customEmoji.offset === 0
    ? title.text.slice(customEmoji.length) // Remove from start
    : title.text.slice(0, -customEmoji.length); // Remove from end

  // Filter out the custom emoji entity and adjust offsets for remaining entities
  const newEntities = title.entities
    .filter((e) => e !== customEmoji)
    .map((e) => {
      if (customEmoji.offset === 0 && e.offset > customEmoji.offset) {
        // If emoji was at start, decrease offset of all entities after it
        return { ...e, offset: e.offset - customEmoji.length };
      }
      return e;
    });

  return {
    text: newText.trim(),
    entities: newEntities,
  };
}