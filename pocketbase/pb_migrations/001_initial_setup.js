migrate((app) => {
  const collections = [
    {
      name: 'app_users',
      fields: [
        { name: 'email', type: 'email', required: true },
        { name: 'password_hash', type: 'text', required: true },
        { name: 'display_name', type: 'text' },
        { name: 'role', type: 'select', required: true, values: ['creator', 'supporter', 'admin'] },
        { name: 'wallet_balance', type: 'number' },
        { name: 'payout_email', type: 'text' },
      ],
    },
    {
      name: 'posts',
      fields: [
        { name: 'user_id', type: 'text', required: true },
        { name: 'content', type: 'text' },
        { name: 'media_url', type: 'text' },
        { name: 'media_file', type: 'file', maxSelect: 1, maxSize: 104857600 },
        { name: 'type', type: 'select', required: true, values: ['post', 'reel', 'story', 'show', 'video', 'photo'] },
        { name: 'views', type: 'number' },
        { name: 'likes', type: 'number' },
        { name: 'author', type: 'text' },
        { name: 'title', type: 'text' },
        { name: 'filter_class', type: 'text' },
        { name: 'thumbnail', type: 'text' },
        { name: 'episodes', type: 'json' },
        { name: 'description', type: 'text' },
        { name: 'categories', type: 'json' },
        { name: 'avatar', type: 'text' },
      ],
    },
    {
      name: 'likes',
      fields: [
        { name: 'post_id', type: 'text', required: true },
        { name: 'user_id', type: 'text', required: true },
      ],
    },
    {
      name: 'tips',
      fields: [
        { name: 'creator_id', type: 'text', required: true },
        { name: 'supporter_id', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'status', type: 'text' },
      ],
    },
    {
      name: 'earnings',
      fields: [
        { name: 'user_id', type: 'text', required: true },
        { name: 'type', type: 'select', required: true, values: ['like', 'view', 'tip'] },
        { name: 'amount', type: 'number', required: true },
        { name: 'creator_share', type: 'number' },
        { name: 'platform_share', type: 'number' },
      ],
    },
    {
      name: 'admin_config',
      fields: [
        { name: 'config_key', type: 'text', required: true },
        { name: 'monetization', type: 'json' },
        { name: 'ad_slots', type: 'json' },
        { name: 'featured_show_ids', type: 'json' },
        { name: 'categories', type: 'json' },
      ],
    },
  ];

  for (const col of collections) {
    const collection = new Collection({
      name: col.name,
      type: 'base',
      fields: col.fields,
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: '',
      deleteRule: '',
    });
    app.save(collection);
  }
}, (app) => {
  const names = ['admin_config', 'earnings', 'tips', 'likes', 'posts', 'app_users'];
  for (const name of names) {
    try { app.delete(app.findCollectionByNameOrId(name)); } catch {}
  }
});
