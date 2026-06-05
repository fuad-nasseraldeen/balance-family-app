-- Remove generic child activity subcategories.
-- Add specific treatments/classes from the app settings page instead, e.g.
-- "טיפול רגשי - גוד" or "טיפול תחזוקה - אדם".

delete from public.categories
where household_id = '1432b272-31f1-4078-ac2a-3940a4d1ca8b'
  and parent_name = 'ילדים וחינוך'
  and name in (
    'חוגים',
    'טיפולים לילדים',
    'טיפולים חוגים',
    'טיפולים\\חוגים',
    'חוגים וטיפולים לילדים'
  );
