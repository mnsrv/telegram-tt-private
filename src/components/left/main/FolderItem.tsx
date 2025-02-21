import type { FC, TeactNode } from '../../../lib/teact/teact';
import React, { useRef } from '../../../lib/teact/teact';

import type { ApiMessageEntityCustomEmoji } from '../../../api/types';
import type { FolderIconName } from '../../../util/folderIcon';
import type { MenuItemContextAction } from '../../ui/ListItem';

import buildClassName from '../../../util/buildClassName';
import { MouseButton } from '../../../util/windowEnvironment';
import renderText from '../../common/helpers/renderText';

import useContextMenuHandlers from '../../../hooks/useContextMenuHandlers';
import { useFastClick } from '../../../hooks/useFastClick';
import useLastCallback from '../../../hooks/useLastCallback';

import FolderIcon from '../../common/FolderIcon';
import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import MenuSeparator from '../../ui/MenuSeparator';
import RippleEffect from '../../ui/RippleEffect';

type OwnProps = {
  className?: string;
  title: TeactNode;
  iconType: FolderIconName;
  customEmoji?: ApiMessageEntityCustomEmoji;
  isActive?: boolean;
  isBlocked?: boolean;
  badgeCount?: number;
  isBadgeActive?: boolean;
  previousActiveTab?: number;
  onClick?: (arg: number) => void;
  clickArg?: number;
  contextActions?: MenuItemContextAction[];
};

const contextRootElementSelector = '#FolderColumn';

const FolderItem: FC<OwnProps> = ({
  title,
  iconType,
  customEmoji,
  isActive,
  isBlocked,
  badgeCount,
  isBadgeActive,
  onClick,
  clickArg,
  contextActions,
}) => {
  // eslint-disable-next-line no-null/no-null
  const itemRef = useRef<HTMLDivElement>(null);

  const {
    contextMenuAnchor,
    handleContextMenu,
    handleBeforeContextMenu,
    handleContextMenuClose,
    handleContextMenuHide,
    isContextMenuOpen,
  } = useContextMenuHandlers(itemRef, !contextActions);

  const { handleClick, handleMouseDown } = useFastClick(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (contextActions && (e.button === MouseButton.Secondary || !onClick)) {
        handleBeforeContextMenu(e);
      }

      if (e.type === 'mousedown' && e.button !== MouseButton.Main) {
        return;
      }

      onClick?.(clickArg!);
    },
  );

  const getTriggerElement = useLastCallback(() => itemRef.current);
  const getRootElement = useLastCallback(() => {
    return contextRootElementSelector
      ? itemRef.current!.closest(contextRootElementSelector)
      : document.body;
  });
  const getMenuElement = useLastCallback(() => {
    return document
      .querySelector('#portals')!
      .querySelector('.Tab-context-menu .bubble');
  });
  const getLayout = useLastCallback(() => ({ withPortal: true }));

  return (
    <div
      className={buildClassName(
        'FolderColumn-item',
        isActive && 'selected',
        isBlocked && 'FolderColumn-item--blocked',
        Boolean(badgeCount) && 'has-unread',
        Boolean(badgeCount) && !isBadgeActive && 'has-unread--muted',
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      ref={itemRef}
    >
      <FolderIcon customEmoji={customEmoji} iconType={iconType} className="FolderIcon" />
      <div className="FolderColumn-name">
        {typeof title === 'string' ? renderText(title) : title}
      </div>
      {Boolean(badgeCount) && (
        <div
          className={buildClassName('badge', isBadgeActive && 'badge--active')}
        >
          {badgeCount}
        </div>
      )}
      <RippleEffect />
      {contextActions && contextMenuAnchor !== undefined && (
        <Menu
          isOpen={isContextMenuOpen}
          anchor={contextMenuAnchor}
          getTriggerElement={getTriggerElement}
          getRootElement={getRootElement}
          getMenuElement={getMenuElement}
          getLayout={getLayout}
          className="Tab-context-menu"
          autoClose
          onClose={handleContextMenuClose}
          onCloseAnimationEnd={handleContextMenuHide}
          withPortal
        >
          {contextActions.map((action) => {
            return 'isSeparator' in action ? (
              <MenuSeparator key={action.key || 'separator'} />
            ) : (
              <MenuItem
                key={action.title}
                icon={action.icon}
                destructive={action.destructive}
                disabled={!action.handler}
                onClick={action.handler}
              >
                {action.title}
              </MenuItem>
            );
          })}
        </Menu>
      )}
    </div>
  );
};

export default FolderItem;
