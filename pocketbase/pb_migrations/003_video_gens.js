migrate((app) => {
  const collection = new Collection({
    name: 'video_gens',
    type: 'base',
    fields: [
      { name: 'user_id', type: 'text', required: true },
      { name: 'prompt', type: 'text', required: true },
      { name: 'luma_gen_id', type: 'text' },
      { name: 'status', type: 'select', required: true, values: ['pending', 'processing', 'completed', 'failed', 'deleted'] },
      { name: 'video_url', type: 'text' },
      { name: 'thumbnail_url', type: 'text' },
      { name: 'model', type: 'text' },
      { name: 'duration', type: 'text' },
      { name: 'resolution', type: 'text' },
      { name: 'captions_on', type: 'bool' },
      { name: 'error_msg', type: 'text' },
      { name: 'daily_date', type: 'text' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  });
  app.save(collection);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId('video_gens')); } catch {}
});
