migrate((app) => {
  const collection = new Collection({
    name: 'live_saves',
    type: 'base',
    fields: [
      { name: 'user_id', type: 'text', required: true },
      { name: 'room_name', type: 'text', required: true },
      { name: 'display_name', type: 'text' },
      { name: 'duration_seconds', type: 'number' },
      { name: 'participant_count', type: 'number' },
      { name: 'captions_used', type: 'bool' },
      { name: 'notes', type: 'text' },
    ],
    listRule: '',
    viewRule: '',
    createRule: '',
    updateRule: '',
    deleteRule: '',
  });
  app.save(collection);
}, (app) => {
  try { app.delete(app.findCollectionByNameOrId('live_saves')); } catch {}
});
