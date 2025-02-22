import type { FC, TeactNode } from '../../../lib/teact/teact';
import React, { memo, useEffect, useMemo } from '../../../lib/teact/teact';
import { getActions, getGlobal, withGlobal } from '../../../global';

import type {
  ApiChatFolder,
  ApiChatlistExportedInvite,
  ApiMessageEntityCustomEmoji,
} from '../../../api/types';
import type { FolderIconName } from '../../../util/folderIcon';
import type { MenuItemContextAction } from '../../ui/ListItem';
import { LeftColumnContent } from '../../../types';

import { ALL_FOLDER_ID, APP_NAME, DEBUG, IS_BETA } from '../../../config';
import { selectCanShareFolder, selectTabState } from '../../../global/selectors';
import { selectCurrentLimit } from '../../../global/selectors/limits';
import buildClassName from '../../../util/buildClassName';
import {
  getDefaultFolderIcon,
  getCustomEmojiFromTitle,
  removeCustomEmojiFromTitle,
  getFolderIcon,
} from '../../../util/folderIcon';
import { MEMO_EMPTY_ARRAY } from '../../../util/memo';
import { IS_ELECTRON, IS_MAC_OS } from '../../../util/windowEnvironment';
import { renderTextWithEntities } from '../../common/helpers/renderTextWithEntities';

import useAppLayout from '../../../hooks/useAppLayout';
import useFlag from '../../../hooks/useFlag';
import { useFolderManagerForUnreadCounters } from '../../../hooks/useFolderManager';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import { useFullscreenStatus } from '../../../hooks/window/useFullscreen';

import Button from '../../ui/Button';
import DropdownMenu from '../../ui/DropdownMenu';
import FolderItem from './FolderItem';
import LeftSideMenuItems from './LeftSideMenuItems';

import './FolderColumn.scss';

type FolderItemWithProperties = {
  id?: number;
  title: TeactNode;
  iconType: FolderIconName;
  customEmoji?: ApiMessageEntityCustomEmoji;
  badgeCount?: number;
  isBlocked?: boolean;
  isBadgeActive?: boolean;
  contextActions?: MenuItemContextAction[];
};

type OwnProps = {
  onContentChange: (content: LeftColumnContent) => void;
};

type StateProps = {
  chatFoldersById: Record<number, ApiChatFolder>;
  folderInvitesById: Record<number, ApiChatlistExportedInvite[]>;
  orderedFolderIds?: number[];
  activeChatFolder: number;
  maxFolders: number;
  maxChatLists: number;
  maxFolderInvites: number;
  shouldSkipHistoryAnimations?: boolean;
};

const FIRST_FOLDER_INDEX = 0;

const FolderColumn: FC<OwnProps & StateProps> = ({
  onContentChange,
  chatFoldersById,
  folderInvitesById,
  orderedFolderIds,
  activeChatFolder,
  maxFolders,
  maxChatLists,
  maxFolderInvites,
  shouldSkipHistoryAnimations,
}) => {
  const {
    closeForumPanel,
    setActiveChatFolder,
    openShareChatFolderModal,
    openDeleteChatFolderModal,
    openEditChatFolder,
    openLimitReachedModal,
  } = getActions();
  const lang = useLang();
  const { isMobile } = useAppLayout();

  const [isBotMenuOpen, markBotMenuOpen, unmarkBotMenuOpen] = useFlag();

  const versionString = IS_BETA
    ? `${APP_VERSION} Beta (${APP_REVISION})`
    : DEBUG
      ? APP_REVISION
      : APP_VERSION;

  const isFullscreen = useFullscreenStatus();

  const allChatsFolder: ApiChatFolder = useMemo(() => {
    return {
      id: ALL_FOLDER_ID,
      emoticon: 'all-chats',
      title: { text: lang('FilterAllChats') },
      includedChatIds: MEMO_EMPTY_ARRAY,
      excludedChatIds: MEMO_EMPTY_ARRAY,
    } satisfies ApiChatFolder;
  }, [lang]);

  const displayedFolders = useMemo(() => {
    return orderedFolderIds
      ? orderedFolderIds
          .map((id) => {
            if (id === ALL_FOLDER_ID) {
              return allChatsFolder;
            }

            return chatFoldersById[id] || {};
          })
          .filter(Boolean)
      : undefined;
  }, [chatFoldersById, allChatsFolder, orderedFolderIds]);

  const folderCountersById = useFolderManagerForUnreadCounters();
  const folderItems = useMemo(() => {
    if (!displayedFolders || !displayedFolders.length) {
      return undefined;
    }

    return displayedFolders.map((folder, i) => {
      const { id, title, emoticon } = folder;

      // Get custom emoji if it's at the start or end
      const customEmoji = getCustomEmojiFromTitle(title);
      
      // Clean title if has custom emoji at start/end
      const cleanedTitle = customEmoji ? removeCustomEmojiFromTitle(title) : title;

      const isBlocked = id !== ALL_FOLDER_ID && i > maxFolders - 1;
      const canShareFolder = selectCanShareFolder(getGlobal(), id);
      const contextActions: MenuItemContextAction[] = [];

      if (canShareFolder) {
        contextActions.push({
          title: lang('FilterShare'),
          icon: 'link',
          handler: () => {
            const chatListCount = Object.values(chatFoldersById).reduce(
              (acc, el) => acc + (el.isChatList ? 1 : 0),
              0,
            );
            if (chatListCount >= maxChatLists && !folder.isChatList) {
              openLimitReachedModal({
                limit: 'chatlistJoined',
              });
              return;
            }

            // Greater amount can be after premium downgrade
            if (folderInvitesById[id]?.length >= maxFolderInvites) {
              openLimitReachedModal({
                limit: 'chatlistInvites',
              });
              return;
            }

            openShareChatFolderModal({
              folderId: id,
            });
          },
        });
      }

      if (id !== ALL_FOLDER_ID) {
        contextActions.push({
          title: lang('FilterEdit'),
          icon: 'edit',
          handler: () => {
            openEditChatFolder({ folderId: id });
          },
        });

        contextActions.push({
          title: lang('FilterDelete'),
          icon: 'delete',
          destructive: true,
          handler: () => {
            openDeleteChatFolderModal({ folderId: id });
          },
        });
      }

      return {
        id,
        title: renderTextWithEntities({
          text: cleanedTitle.text,
          entities: cleanedTitle.entities,
          noCustomEmojiPlayback: folder.noTitleAnimations,
        }),
        customEmoji,
        iconType: emoticon
          ? getFolderIcon(folder.emoticon)
          : getDefaultFolderIcon(folder),
        badgeCount: folderCountersById[id]?.chatsCount,
        isBadgeActive: Boolean(folderCountersById[id]?.notificationsCount),
        isBlocked,
        contextActions: contextActions?.length ? contextActions : undefined,
      } satisfies FolderItemWithProperties;
    });
  }, [
    displayedFolders,
    maxFolders,
    folderCountersById,
    lang,
    chatFoldersById,
    maxChatLists,
    folderInvitesById,
    maxFolderInvites,
  ]);

  const handleSwitchTab = useLastCallback((index: number) => {
    setActiveChatFolder(
      { activeChatFolder: index },
      { forceOnHeavyAnimation: true },
    );
  });

  // Prevent `activeTab` pointing at non-existing folder after update
  useEffect(() => {
    if (!folderItems?.length) {
      return;
    }

    if (activeChatFolder >= folderItems.length) {
      setActiveChatFolder({ activeChatFolder: FIRST_FOLDER_INDEX });
    }
  }, [activeChatFolder, folderItems, setActiveChatFolder]);

  const handleSelectArchived = useLastCallback(() => {
    onContentChange(LeftColumnContent.Archived);
    closeForumPanel();
  });

  const handleSelectContacts = useLastCallback(() => {
    onContentChange(LeftColumnContent.Contacts);
  });

  const handleSelectSettings = useLastCallback(() => {
    onContentChange(LeftColumnContent.Settings);
  });

  const MainButton: FC<{ onTrigger: () => void; isOpen?: boolean }> = useMemo(() => {
    return ({ onTrigger, isOpen }) => (
      <Button
        isRectangular
        ripple={!isMobile}
        size="default"
        color="translucent"
        className={isOpen ? 'active' : ''}
        onClick={onTrigger}
        ariaLabel={lang('AccDescrOpenMenu2')}
      >
        <div className={buildClassName(
          'animated-menu-icon',
          shouldSkipHistoryAnimations && 'no-animation',
        )}
        />
      </Button>
    );
  }, [isMobile, lang, shouldSkipHistoryAnimations]);

  const shouldRenderFolders = folderItems && folderItems.length > 1;

  return (
    <div id="FolderColumn" className={buildClassName('FolderColumn')}>
      <DropdownMenu
        trigger={MainButton}
        footer={`${APP_NAME} ${versionString}`}
        className={buildClassName('main-menu')}
        forceOpen={isBotMenuOpen}
        transformOriginX={
          IS_ELECTRON && IS_MAC_OS && !isFullscreen ? 90 : undefined
        }
      >
        <LeftSideMenuItems
          onSelectArchived={handleSelectArchived}
          onSelectContacts={handleSelectContacts}
          onSelectSettings={handleSelectSettings}
          onBotMenuOpened={markBotMenuOpen}
          onBotMenuClosed={unmarkBotMenuOpen}
        />
      </DropdownMenu>

      <div
        className={buildClassName(
          'FolderColumn-list',
          'custom-scroll',
          'no-scrollbar',
        )}
      >
        {shouldRenderFolders &&
          folderItems.map((item, i) => (
            <FolderItem
              key={item.id}
              title={item.title}
              iconType={item.iconType}
              customEmoji={item.customEmoji}
              isActive={i === activeChatFolder}
              isBlocked={item.isBlocked}
              badgeCount={item.badgeCount}
              isBadgeActive={item.isBadgeActive}
              onClick={handleSwitchTab}
              clickArg={i}
              contextActions={item.contextActions}
            />
          ))}
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      chatFolders: {
        byId: chatFoldersById,
        orderedIds: orderedFolderIds,
        invites: folderInvitesById,
      },
    } = global;
    const { activeChatFolder, shouldSkipHistoryAnimations } = selectTabState(global);

    return {
      chatFoldersById,
      folderInvitesById,
      orderedFolderIds,
      activeChatFolder,
      maxFolders: selectCurrentLimit(global, 'dialogFilters'),
      maxFolderInvites: selectCurrentLimit(global, 'chatlistInvites'),
      maxChatLists: selectCurrentLimit(global, 'chatlistJoined'),
      shouldSkipHistoryAnimations,
    };
  },
)(FolderColumn)); 