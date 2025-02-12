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
  '🗂': 'folder',
  '📁': 'folder',  // Custom
  '📋': 'folder',  // Setup
  
  // Special Categories
  '⭐': 'star',
  '👑': 'star',    // Crown
  
  // Animals and Nature
  '🐱': 'user',
  '🌹': 'folder',  // Flower
  
  // Activities and Objects
  '📕': 'folder',
  '💰': 'folder',
  '🎮': 'folder',
  '🏡': 'folder',
  '🏠': 'folder',  // Home
  '💡': 'folder',
  '👍': 'folder',
  '🔒': 'folder',
  '❤️': 'folder',
  '➕': 'folder',
  '🎵': 'folder',
  '🎨': 'folder',
  '✈️': 'folder',
  '⚽️': 'folder',
  '🎓': 'folder',
  '🛫': 'folder',
  '🍷': 'folder',
  '🎭': 'folder'
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