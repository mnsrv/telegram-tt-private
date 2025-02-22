import type { RefObject } from 'react';
import type { FC } from '../../../lib/teact/teact';
import React, {
  memo, useCallback, useEffect, useRef,
} from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiSticker } from '../../../api/types';

import { selectIsContextMenuTranslucent } from '../../../global/selectors';

import useFlag from '../../../hooks/useFlag';

import CustomEmojiPicker from '../../common/CustomEmojiPicker';
import Menu from '../../ui/Menu';
import Portal from '../../ui/Portal';

import styles from './FolderIconPickerMenu.module.scss';

export type OwnProps = {
  isOpen: boolean;
  emoticonButtonRef: RefObject<HTMLButtonElement>;
  onCustomEmojiSelect: (emoji: ApiSticker) => void;
  onClose: () => void;
};

interface StateProps {
  areFeaturedStickersLoaded?: boolean;
  isTranslucent?: boolean;
}

const FolderIconPickerMenu: FC<OwnProps & StateProps> = ({
  isOpen,
  emoticonButtonRef,
  areFeaturedStickersLoaded,
  isTranslucent,
  onCustomEmojiSelect,
  onClose,
}) => {
  const { loadFeaturedEmojiStickers } = getActions();

  const transformOriginX = useRef<number>();
  const [isContextMenuShown, markContextMenuShown, unmarkContextMenuShown] = useFlag();

  useEffect(() => {
    transformOriginX.current = emoticonButtonRef.current!.getBoundingClientRect().right;

  }, [isOpen, emoticonButtonRef]);

  useEffect(() => {
    if (isOpen && !areFeaturedStickersLoaded) {
      loadFeaturedEmojiStickers();
    }
  }, [areFeaturedStickersLoaded, isOpen, loadFeaturedEmojiStickers]);

  const handleEmojiSelect = useCallback((sticker: ApiSticker) => {
    onCustomEmojiSelect(sticker);
    onClose();
  }, [onClose, onCustomEmojiSelect]);

  return (
    <Portal>
      <Menu
        isOpen={isOpen}
        noCompact
        positionX="right"
        bubbleClassName={styles.menuContent}
        onClose={onClose}
        transformOriginX={transformOriginX.current}
        noCloseOnBackdrop={isContextMenuShown}
      >
        <CustomEmojiPicker
          idPrefix="folder-emoticon-"
          loadAndPlay={isOpen}
          isHidden={!isOpen}
          isFolderIconPicker
          isTranslucent={isTranslucent}
          onContextMenuOpen={markContextMenuShown}
          onContextMenuClose={unmarkContextMenuShown}
          onCustomEmojiSelect={handleEmojiSelect}
          onContextMenuClick={onClose}
        />
      </Menu>
    </Portal>
  );
};

export default memo(withGlobal<OwnProps>((global): StateProps => {
  return {
    areFeaturedStickersLoaded: Boolean(global.customEmojis.featuredIds?.length),
    isTranslucent: selectIsContextMenuTranslucent(global),
  };
})(FolderIconPickerMenu)); 