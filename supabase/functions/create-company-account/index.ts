import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCompanyAccountBody {
  companyName?: string
  email?: string
  password?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return jsonResponse({ error: 'Server misconfigured' }, 500)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization' }, 401)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: adminRow, error: adminError } = await adminClient
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (adminError) {
      return jsonResponse({ error: adminError.message }, 500)
    }
    if (!adminRow) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    const body = (await req.json()) as CreateCompanyAccountBody
    const companyName = body.companyName?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''

    if (!companyName || !email || password.length < 6) {
      return jsonResponse(
        { error: 'companyName, email, and password (min 6 chars) are required' },
        400,
      )
    }

    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createUserError || !createdUser.user) {
      return jsonResponse(
        { error: createUserError?.message ?? 'Failed to create user' },
        400,
      )
    }

    const userId = createdUser.user.id

    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .insert({ name: companyName, owner_email: email })
      .select('id')
      .single()

    if (companyError || !company) {
      await adminClient.auth.admin.deleteUser(userId)
      return jsonResponse(
        { error: companyError?.message ?? 'Failed to create company' },
        500,
      )
    }

    const { error: memberError } = await adminClient.from('company_members').insert({
      company_id: company.id,
      user_id: userId,
      role: 'owner',
    })

    if (memberError) {
      await adminClient.from('companies').delete().eq('id', company.id)
      await adminClient.auth.admin.deleteUser(userId)
      return jsonResponse({ error: memberError.message }, 500)
    }

    return jsonResponse({ companyId: company.id, userId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return jsonResponse({ error: message }, 500)
  }
})

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
