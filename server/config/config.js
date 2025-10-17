const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://yiiksaebixlxambuwlbj.supabase.co', // URL do Supabase
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpaWtzYWViaXhseGFtYnV3bGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzgyMjMsImV4cCI6MjA3NDg1NDIyM30.qSflD_ct7R3JZqd4d-ISQLJ_a4Luy60_CjZ04gcb5dU' // Sua chave pública
);

module.exports = supabase;