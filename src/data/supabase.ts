import { createClient } from '@supabase/supabase-js'

// Le client Supabase, créé UNE seule fois pour toute l'app.
// Seuls les fichiers de src/data/ l'importent : les composants ne savent pas
// que les données viennent de Supabase.
//
// Vite remplace import.meta.env.VITE_… par leur valeur AU MOMENT DU BUILD.
// Ces valeurs se retrouvent donc en clair dans le JavaScript téléchargé :
// c'est voulu, la clé « publishable » est publique. Ce sont les règles RLS
// de la base (supabase/schema.sql) qui protègent les données.
const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Message clair plutôt qu'une erreur obscure si une variable manque
// (ex. .env.local absent, ou secret oublié dans GitHub).
if (!url || !cle) {
  throw new Error('Variables Supabase manquantes : voir .env.example')
}

// Par défaut, supabase-js garde la session dans le localStorage et la renouvelle
// automatiquement : on ne se connecte qu'une fois par appareil.
export const supabase = createClient(url, cle)
