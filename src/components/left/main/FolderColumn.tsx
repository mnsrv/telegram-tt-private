import type { FC } from '../../../lib/teact/teact';
import React, { memo, useCallback, useMemo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiChatFolder } from '../../../api/types';
import { LeftColumnContent } from '../../../types';

import { ALL_FOLDER_ID, APP_NAME, DEBUG, IS_BETA } from '../../../config';
import { selectTabState } from '../../../global/selectors';
import { selectCurrentLimit } from '../../../global/selectors/limits';
import buildClassName from '../../../util/buildClassName';
import { MEMO_EMPTY_ARRAY } from '../../../util/memo';
import { IS_ELECTRON, IS_MAC_OS } from '../../../util/windowEnvironment';
import { renderTextWithEntities } from '../../common/helpers/renderTextWithEntities';
import DropdownMenu from '../../ui/DropdownMenu';
import RippleEffect from '../../ui/RippleEffect';
import Button from '../../ui/Button';
import LeftSideMenuItems from './LeftSideMenuItems';

import useFlag from '../../../hooks/useFlag';
import useLang from '../../../hooks/useLang';
import useLastCallback from '../../../hooks/useLastCallback';
import useAppLayout from '../../../hooks/useAppLayout';
import { useFullscreenStatus } from '../../../hooks/window/useFullscreen';
import { useFolderManagerForUnreadCounters } from '../../../hooks/useFolderManager';
import FolderIcon from '../../common/FolderIcon';

import './FolderColumn.scss';

type OwnProps = {
  onContentChange: (content: LeftColumnContent) => void;
};

type StateProps = {
  folderIds?: number[];
  foldersById: Record<number, ApiChatFolder>;
  activeChatFolder: number;
  maxFolders: number;
  shouldSkipHistoryAnimations?: boolean;
};

const FolderColumn: FC<OwnProps & StateProps> = ({
  onContentChange,
  folderIds,
  foldersById,
  activeChatFolder,
  maxFolders,
  shouldSkipHistoryAnimations,
}) => {
  const { closeForumPanel, setActiveChatFolder } = getActions();
  const lang = useLang();
  const { isMobile } = useAppLayout();
  const folderCountersById = useFolderManagerForUnreadCounters();

  const [isBotMenuOpen, markBotMenuOpen, unmarkBotMenuOpen] = useFlag();

  const versionString = IS_BETA ? `${APP_VERSION} Beta (${APP_REVISION})` : (DEBUG ? APP_REVISION : APP_VERSION);

  const isFullscreen = useFullscreenStatus();

  const handleFolderClick = useCallback((index: number) => {
    setActiveChatFolder({ activeChatFolder: index }, { forceOnHeavyAnimation: true });
  }, [setActiveChatFolder]);

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

  if (!folderIds?.length || folderIds.length <= 1) {
    return null;
  }

  return (
    <div className={buildClassName('FolderColumn')}>
      <DropdownMenu
        trigger={MainButton}
        footer={`${APP_NAME} ${versionString}`}
        className={buildClassName('main-menu')}
        forceOpen={isBotMenuOpen}
        transformOriginX={IS_ELECTRON && IS_MAC_OS && !isFullscreen ? 90 : undefined}
      >
        <LeftSideMenuItems
          onSelectArchived={handleSelectArchived}
          onSelectContacts={handleSelectContacts}
          onSelectSettings={handleSelectSettings}
          onBotMenuOpened={markBotMenuOpen}
          onBotMenuClosed={unmarkBotMenuOpen}
        />
      </DropdownMenu>

      <div className={buildClassName('FolderColumn-list', 'custom-scroll', 'no-scrollbar')}>
        {folderIds.map((id, index) => {
          const folder: ApiChatFolder = id === ALL_FOLDER_ID ? {
            id: ALL_FOLDER_ID,
            emoticon: 'all-chats',
            title: { text: lang('FilterAllChats') },
            includedChatIds: MEMO_EMPTY_ARRAY,
            excludedChatIds: MEMO_EMPTY_ARRAY,
          } : foldersById[id];

          if (!folder) return undefined;

          const isBlocked = id !== ALL_FOLDER_ID && index > maxFolders - 1;
          const counter = folderCountersById[id];
          const hasUnread = Boolean(counter?.chatsCount);
          const isMuted = Boolean(counter?.chatsCount && !counter.notificationsCount);

          return (
            <div
              key={id}
              className={buildClassName(
                'FolderColumn-item',
                index === activeChatFolder && 'selected',
                isBlocked && 'FolderColumn-item--blocked',
                hasUnread && 'has-unread',
                hasUnread && isMuted && 'has-unread--muted',
              )}
              onClick={isBlocked ? undefined : () => handleFolderClick(index)}
            >
              <FolderIcon folder={folder} className="FolderIcon" />
              <div className="FolderColumn-name">
                <span>
                  {renderTextWithEntities({
                    text: folder.title.text,
                    entities: folder.title.entities,
                  })}
                </span>
              </div>
              {hasUnread && (
                <div className="badge">{counter.chatsCount}</div>
              )}
              <RippleEffect />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(withGlobal<OwnProps>(
  (global): StateProps => {
    const {
      chatFolders: {
        byId: foldersById,
        orderedIds: folderIds,
      },
    } = global;
    const { activeChatFolder, shouldSkipHistoryAnimations } = selectTabState(global);

    return {
      folderIds,
      foldersById,
      activeChatFolder,
      maxFolders: selectCurrentLimit(global, 'dialogFilters'),
      shouldSkipHistoryAnimations
    };
  },
)(FolderColumn)); 