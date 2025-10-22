import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('RESEND_API_KEY')
    const emailFrom = Deno.env.get('EMAIL_FROM')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const diagnostics = {
      timestamp: new Date().toISOString(),
      configuration: {
        resend_api_key_set: !!apiKey,
        resend_api_key_length: apiKey?.length || 0,
        resend_api_key_valid: apiKey ? apiKey.startsWith('re_') && apiKey.length > 20 : false,
        email_from_configured: !!emailFrom,
        email_from_value: emailFrom || 'NOT SET (will use default: noreply@oversight.local)',
        supabase_url_set: !!supabaseUrl,
        supabase_key_set: !!supabaseKey,
      },
      recommendations: [],
      warnings: []
    }

    // Add recommendations
    if (!apiKey) {
      diagnostics.warnings.push('CRITICAL: RESEND_API_KEY not set')
      diagnostics.recommendations.push('Set RESEND_API_KEY in Supabase Functions → Settings → Environment Variables')
    } else if (!apiKey.startsWith('re_')) {
      diagnostics.warnings.push('ERROR: RESEND_API_KEY does not start with "re_"')
      diagnostics.recommendations.push('API key format is invalid. Check your Resend API key')
    }

    if (!emailFrom) {
      diagnostics.warnings.push('WARNING: EMAIL_FROM not configured')
      diagnostics.recommendations.push('Set EMAIL_FROM to a verified sender email in Resend (e.g., noreply@yourdomain.com)')
      diagnostics.recommendations.push('Current fallback: noreply@oversight.local (unlikely to be verified)')
    }

    // Test Resend connectivity if API key is valid
    if (apiKey && apiKey.startsWith('re_')) {
      try {
        const testResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: emailFrom || 'noreply@oversight.local',
            to: 'test@example.com',
            subject: 'Test',
            html: '<p>Test</p>',
          }),
        })

        diagnostics.resend_connectivity = {
          status_code: testResponse.status,
          status_ok: testResponse.ok,
          message: testResponse.ok ? 'Resend API is reachable' : 'Resend API rejected request'
        }

        if (testResponse.status === 403) {
          diagnostics.warnings.push('CRITICAL: Sender email is not verified in Resend (HTTP 403)')
          diagnostics.recommendations.push('Go to Resend Dashboard → Sender Identity to verify your sender email')
          diagnostics.recommendations.push(`Try verifying: ${emailFrom || 'noreply@oversight.local'}`)
        }
      } catch (error) {
        diagnostics.resend_connectivity = {
          error: error.message,
          status: 'FAILED'
        }
        diagnostics.recommendations.push('Cannot reach Resend API. Check your internet connection and API key')
      }
    }

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
