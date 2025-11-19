import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { token, email } = await req.json()

    if (!token || !email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing token or email parameter',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Use service role key to bypass RLS and verify invitation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Service misconfigured - missing environment variables',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 Verifying invitation:', {
      tokenLength: token.length,
      email,
      timestamp: new Date().toISOString(),
    })

    // Check if invitation exists and is valid
    const { data, error } = await supabase
      .from('invitations')
      .select('id, email, role, department, status, expires_at, token, created_at')
      .eq('token', token)
      .ilike('email', email)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error) {
      console.error('❌ Invitation verification failed:', {
        code: error.code,
        message: error.message,
        details: error.details,
      })

      // Determine if it's a "not found" or "RLS" issue
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invitation not found or has expired',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to verify invitation',
          details: error.message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!data) {
      console.error('❌ No invitation found for:', { token: token.substring(0, 10) + '...', email })
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invitation not found or has expired',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    console.log('✅ Invitation verified successfully:', {
      id: data.id,
      email: data.email,
      role: data.role,
      department: data.department,
      expiresAt: data.expires_at,
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          email: data.email,
          role: data.role,
          department: data.department,
          status: data.status,
          expires_at: data.expires_at,
          token: data.token,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error in verify-invitation function:', {
      message: error.message,
      stack: error.stack,
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
