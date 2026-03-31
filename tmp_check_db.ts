import { supabase } from './src/integrations/supabase/client';

async function check() {
  const { data, error } = await supabase
    .from('product_variations')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching variations:', error);
  } else {
    console.log('Columns in product_variations:', Object.keys(data[0] || {}));
  }
}

check();
