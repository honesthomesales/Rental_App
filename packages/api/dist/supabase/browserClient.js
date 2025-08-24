"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseBrowser = supabaseBrowser;
const supabase_js_1 = require("@supabase/supabase-js");
let client = null;
function supabaseBrowser() {
    if (client)
        return client;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    client = (0, supabase_js_1.createClient)(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return client;
}
exports.default = supabaseBrowser;
