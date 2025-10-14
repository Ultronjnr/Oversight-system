import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendWithResend(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' }
  const from = Deno.env.get('EMAIL_FROM') || 'Oversight <noreply@example.com>'
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html })
  })
  if (!resp.ok) {
    return { ok: false, error: `Resend error ${resp.status}` }
  }
  return { ok: true }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, inviteLink, role, inviterEmail, department } = await req.json()

    // Get email template
    const { data: template } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_type', 'invitation')
      .eq('is_system', true)
      .single()

    let emailSubject = 'Welcome to Oversight - Complete Your Account Setup'
    let emailBody = `Dear ${email.split('@')[0]},\n\nYou have been invited to join the Oversight Procurement Management System as a ${role}.\n\nTo complete your account setup, please click the link below:\n${inviteLink}\n\nThis invitation will expire in 7 days.\n\nYour role: ${role}\n${department ? `Department: ${department}` : ''}\n\nIf you have any questions, please contact your administrator (${inviterEmail || 'noreply@oversight.co.za'}).\n\nBest regards,\nThe Oversight Team`

    if (template) {
      emailSubject = template.subject
        .replace('{USER_NAME}', email.split('@')[0])
        .replace('{ROLE}', role)
        .replace('{DEPARTMENT}', department || 'Not specified')

      emailBody = template.body
        .replace('{USER_NAME}', email.split('@')[0])
        .replace('{ROLE}', role)
        .replace('{DEPARTMENT}', department || 'Not specified')
        .replace('{INVITATION_LINK}', inviteLink)
        .replace('{EXPIRY_DATE}', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString())
    }

    const html = emailBody.replace(/\n/g, '<br>')

    // Try to send via Resend if configured
    const sent = await sendWithResend(email, emailSubject, html)

    if (!sent.ok) {
      console.log('Resend not configured or failed, falling back to log:', sent.error)
      console.log('Invitation email (fallback):', { to: email, subject: emailSubject, html })
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        provider: sent.ok ? 'resend' : 'console',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('Error sending invitation email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
