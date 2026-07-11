import 'dotenv/config';

async function fetchTables() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("ERROR: SUPABASE_URL or SUPABASE_ANON_KEY is missing from environment variables.");
    process.exit(1);
  }

  // Clean URL and construct rest endpoint
  const restUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/`;

  try {
    console.log(`Connecting to Supabase rest API: ${restUrl}`);
    const response = await fetch(restUrl, {
      method: "GET",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // In PostgREST/Supabase, definitions contains the tables/views
    const tables = data.definitions ? Object.keys(data.definitions) : [];
    console.log("SUCCESS_TABLES:" + JSON.stringify(tables));
  } catch (error: any) {
    console.error("ERROR_FETCH:", error.message || error);
    process.exit(1);
  }
}

fetchTables();
