'use client';

import { useState, useTransition } from 'react';
import { HeartIcon } from '@phosphor-icons/react/dist/ssr';
import { toggleLikeAction } from './actions';

export function LikeButton({
  postId,
  initialLikes,
  initialLiked,
}: {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialLikes);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    start(async () => {
      const fd = new FormData();
      fd.set('postId', postId);
      await toggleLikeAction(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`inline-flex items-center gap-1 text-xs font-bold transition ${
        liked
          ? 'text-rose-600'
          : 'text-stone-500 hover:text-rose-600'
      }`}
    >
      <HeartIcon size={16} weight={liked ? 'fill' : 'regular'} />
      {count}
    </button>
  );
}
