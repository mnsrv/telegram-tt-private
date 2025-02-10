import type { FC } from '../../../lib/teact/teact';
import React, { memo, useCallback } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiChatFolder } from '../../../api/types';

import { ALL_FOLDER_ID } from '../../../config';
import { selectTabState } from '../../../global/selectors';
import { selectCurrentLimit } from '../../../global/selectors/limits';
import buildClassName from '../../../util/buildClassName';
import { renderTextWithEntities } from '../../common/helpers/renderTextWithEntities';

import useLang from '../../../hooks/useLang';
import FolderLogo from '../../../assets/icons/folders/folder.svg';

import './FolderColumn.scss';

type OwnProps = {
  className?: string;
};

type StateProps = {
  folderIds?: number[];
  foldersById: Record<number, ApiChatFolder>;
  activeChatFolder: number;
  maxFolders: number;
};

const FolderColumn: FC<OwnProps & StateProps> = ({
  className,
  folderIds,
  foldersById,
  activeChatFolder,
  maxFolders,
}) => {
  const { setActiveChatFolder } = getActions();
  const lang = useLang();

  const handleFolderClick = useCallback((index: number) => {
    setActiveChatFolder({ activeChatFolder: index }, { forceOnHeavyAnimation: true });
  }, [setActiveChatFolder]);

  if (!folderIds?.length || folderIds.length <= 1) {
    return null;
  }

  return (
    <div className={buildClassName('FolderColumn', className)}>
      {folderIds.map((id, index) => {
        const folder = id === ALL_FOLDER_ID ? {
          id: ALL_FOLDER_ID,
          title: {
            text: index === 0 ? lang('FilterAllChatsShort') : lang('FilterAllChats'),
            entities: [],
          },
        } : foldersById[id];

        if (!folder) return undefined;

        const isBlocked = id !== ALL_FOLDER_ID && index > maxFolders - 1;

        return (
          <div
            key={id}
            className={buildClassName(
              'FolderColumn-item',
              index === activeChatFolder && 'FolderColumn-item--active',
              isBlocked && 'FolderColumn-item--blocked',
            )}
            onClick={isBlocked ? undefined : () => handleFolderClick(index)}
          >
            <img src={FolderLogo} alt="" className="FolderIcon" draggable={false} />
            {renderTextWithEntities({
              text: folder.title.text,
              entities: folder.title.entities,
            })}
          </div>
        );
      })}
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
    const { activeChatFolder } = selectTabState(global);

    return {
      folderIds,
      foldersById,
      activeChatFolder,
      maxFolders: selectCurrentLimit(global, 'dialogFilters'),
    };
  },
)(FolderColumn)); 