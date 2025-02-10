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
              index === activeChatFolder && 'selected',
              isBlocked && 'FolderColumn-item--blocked',
            )}
            onClick={isBlocked ? undefined : () => handleFolderClick(index)}
          >
            <svg className='folderIcon' width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.21265 9.53789C6 10.1456 6 10.9016 6 12.4135C6 12.6655 6 12.7915 6.03544 12.8928C6.09892 13.0742 6.24156 13.2169 6.42298 13.2803C6.52427 13.3158 6.65026 13.3158 6.90226 13.3158H29.2421C29.3595 13.3158 29.4181 13.3158 29.4672 13.308C29.7375 13.2652 29.9494 13.0533 29.9922 12.783C30 12.7339 30 12.6752 30 12.5579C30 12.0885 30 11.8538 29.9689 11.6574C29.7977 10.5764 28.9499 9.72863 27.8689 9.55742C27.6725 9.52632 27.4378 9.52632 26.9684 9.52632H19.1548C18.9418 9.52632 18.8353 9.52632 18.7327 9.52075C17.8706 9.47396 17.0503 9.13419 16.4077 8.55768C16.3312 8.48907 16.2559 8.41377 16.1053 8.26319C15.9547 8.1126 15.8794 8.03725 15.8029 7.96863C15.1602 7.39213 14.3399 7.05236 13.4778 7.00557C13.3752 7 13.2687 7 13.0557 7H11.4135C9.90159 7 9.14562 7 8.53789 7.21265C7.44937 7.59354 6.59354 8.44937 6.21265 9.53789Z" fill="currentColor"/>
              <path d="M6.20651 16.8766C6 17.282 6 17.8125 6 18.8737V20.3895C6 23.2192 6 24.6341 6.5507 25.7149C7.03512 26.6656 7.80807 27.4386 8.75878 27.923C9.8396 28.4737 11.2545 28.4737 14.0842 28.4737H21.9158C24.7455 28.4737 26.1604 28.4737 27.2412 27.923C28.1919 27.4386 28.9649 26.6656 29.4493 25.7149C30 24.6341 30 23.2192 30 20.3895V18.8737C30 17.8125 30 17.282 29.7935 16.8766C29.6118 16.5201 29.322 16.2303 28.9655 16.0486C28.5602 15.8421 28.0296 15.8421 26.9684 15.8421H9.03158C7.97043 15.8421 7.43985 15.8421 7.03454 16.0486C6.67803 16.2303 6.38817 16.5201 6.20651 16.8766Z" fill="currentColor"/>
            </svg>
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