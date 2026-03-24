import { pb } from './api';

type EventCallback = (data: any) => void;

const listeners: Record<string, EventCallback[]> = {};

let subscribed = false;

function emit(event: string, data: any) {
  (listeners[event] || []).forEach(cb => cb(data));
}

export function getSocket() {
  if (!subscribed) {
    subscribed = true;

    pb.collection('posts').subscribe('*', (e) => {
      if (e.action === 'create') {
        const r = e.record;
        emit('new_post', {
          id: r.id,
          user_id: r.user_id,
          content: r.content,
          media_url: r.media_file ? pb.files.getURL(r, r.media_file) : r.media_url,
          type: r.type,
          views: r.views || 0,
          likes: r.likes || 0,
          author: r.author,
          title: r.title,
          filter_class: r.filter_class,
          thumbnail: r.thumbnail,
          episodes: r.episodes,
          description: r.description,
          categories: r.categories,
          avatar: r.avatar,
          created_at: r.created,
        });
      }
      if (e.action === 'update') {
        const r = e.record;
        emit('like_update', { postId: r.id, likes: r.likes || 0 });
        emit('view_update', { postId: r.id, views: r.views || 0 });
      }
    }).catch(() => {});

    pb.collection('app_users').subscribe('*', (e) => {
      if (e.action === 'update') {
        const r = e.record;
        emit('wallet_update', {
          userId: r.id,
          wallet_balance: r.wallet_balance || 0,
        });
      }
    }).catch(() => {});

    pb.collection('tips').subscribe('*', (e) => {
      if (e.action === 'create') {
        const r = e.record;
        emit('tip_received', {
          creator_id: r.creator_id,
          supporter_id: r.supporter_id,
          amount: r.amount,
        });
      }
    }).catch(() => {});
  }

  return {
    on: (event: string, callback: EventCallback) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    },
    off: (event: string, callback?: EventCallback) => {
      if (!callback) {
        delete listeners[event];
      } else if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    },
    connected: true,
  };
}
