import type { FC } from '../../../../lib/teact/teact';
import React, { memo, useMemo } from '../../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../../global';

import type {
  ApiMessage,
  ApiPeer,
  ApiReaction,
  ApiReactionKey,
  ApiSavedReactionTag,
} from '../../../../api/types';
import type { ObserveFn } from '../../../../hooks/useIntersectionObserver';
import type { ThreadId } from '../../../../types';
import type { Signal } from '../../../../util/signals';

import { getReactionKey, isReactionChosen } from '../../../../global/helpers';
import { selectPeer } from '../../../../global/selectors';
import buildClassName from '../../../../util/buildClassName';
import { getMessageKey } from '../../../../util/keys/messageKey';

import useDerivedState from '../../../../hooks/useDerivedState';
import useLastCallback from '../../../../hooks/useLastCallback';
import useOldLang from '../../../../hooks/useOldLang';

import ReactionButton from './ReactionButton';
import SavedTagButton from './SavedTagButton';

import './Reactions.scss';

type OwnProps = {
  message: ApiMessage;
  threadId?: ThreadId;
  isOutside?: boolean;
  maxWidth?: number;
  metaChildren?: React.ReactNode;
  tags?: Record<ApiReactionKey, ApiSavedReactionTag>;
  isCurrentUserPremium?: boolean;
  observeIntersection?: ObserveFn;
  noRecentReactors?: boolean;
  getIsMessageListReady: Signal<boolean>;
};

const MAX_RECENT_AVATARS = 3;

const Reactions: FC<OwnProps> = ({
  message,
  threadId,
  isOutside,
  maxWidth,
  metaChildren,
  observeIntersection,
  noRecentReactors,
  isCurrentUserPremium,
  tags,
  getIsMessageListReady,
}) => {
  const {
    toggleReaction,
    updateMiddleSearch,
    performMiddleSearch,
    openPremiumModal,
  } = getActions();
  const lang = useOldLang();

  const { results, areTags, recentReactions } = message.reactions!;

  const totalCount = useMemo(() => (
    results.reduce((acc, reaction) => acc + reaction.count, 0)
  ), [results]);

  const isMessageListReady = useDerivedState(getIsMessageListReady);

  const recentReactorsByReactionKey = useMemo(() => {
    const global = getGlobal();

    return recentReactions?.reduce((acc, recentReaction) => {
      const { reaction, peerId } = recentReaction;
      const key = getReactionKey(reaction);
      const peer = selectPeer(global, peerId);

      if (!peer) return acc;

      const peers = acc[key] || [];
      peers.push(peer);
      acc[key] = peers;
      return acc;
    }, {} as Record<ApiReactionKey, ApiPeer[]>);
  }, [recentReactions]);

  const props = useMemo(() => {
    const messageKey = getMessageKey(message);
    return results.map((reaction) => {
      const reactionKey = getReactionKey(reaction.reaction);
      const recentReactors = recentReactorsByReactionKey?.[reactionKey];
      const shouldHideRecentReactors = totalCount > MAX_RECENT_AVATARS || noRecentReactors;
      const tag = areTags ? tags?.[reactionKey] : undefined;

      return {
        reaction,
        reactionKey,
        messageKey,
        recentReactors: !shouldHideRecentReactors ? recentReactors : undefined,
        isChosen: isReactionChosen(reaction),
        tag,
      };
    });
  }, [message, noRecentReactors, recentReactorsByReactionKey, results, areTags, tags, totalCount]);

  const handleClick = useLastCallback((reaction: ApiReaction) => {
    if (areTags) {
      if (!isCurrentUserPremium) {
        openPremiumModal({
          initialSection: 'saved_tags',
        });
        return;
      }

      updateMiddleSearch({ chatId: message.chatId, threadId, update: { savedTag: reaction } });
      performMiddleSearch({ chatId: message.chatId, threadId });
      return;
    }

    toggleReaction({
      chatId: message.chatId,
      messageId: message.id,
      reaction,
    });
  });

  const handleRemoveReaction = useLastCallback((reaction: ApiReaction) => {
    toggleReaction({
      chatId: message.chatId,
      messageId: message.id,
      reaction,
    });
  });

  return (
    <div
      className={buildClassName('Reactions', isOutside && 'is-outside')}
      style={maxWidth ? `max-width: ${maxWidth}px` : undefined}
      dir={lang.isRtl ? 'rtl' : 'ltr'}
    >
      {props.map(({
        reaction, recentReactors, messageKey, reactionKey, isChosen, tag,
      }) => (
        areTags ? (
          <SavedTagButton
            key={reactionKey}
            className="message-reaction"
            chosenClassName="chosen"
            containerId={messageKey}
            isOwnMessage={message.isOutgoing}
            isChosen={isChosen}
            reaction={reaction.reaction}
            tag={tag}
            withContextMenu={isCurrentUserPremium}
            onClick={handleClick}
            onRemove={handleRemoveReaction}
            observeIntersection={observeIntersection}
            shouldDelayInit={!isMessageListReady}
          />
        ) : (
          <ReactionButton
            key={reactionKey}
            className="message-reaction"
            chosenClassName="chosen"
            containerId={messageKey}
            isOwnMessage={message.isOutgoing}
            recentReactors={recentReactors}
            reaction={reaction}
            onClick={handleClick}
            observeIntersection={observeIntersection}
            shouldDelayInit={!isMessageListReady}
          />
        )
      ))}
      {metaChildren}
    </div>
  );
};

export default memo(Reactions);
