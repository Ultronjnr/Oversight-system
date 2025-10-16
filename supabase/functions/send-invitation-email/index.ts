import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResendResponse {
  ok: boolean
  error?: string
  data?: any
  diagnostics?: {
    apiKeyLength?: number
    apiKeyValid?: boolean
    fromEmailSet?: boolean
    resendStatusCode?: number
    resendErrorMessage?: string
  }
}

async function sendWithResend(to: string, subject: string, html: string): Promise<ResendResponse> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('EMAIL_FROM') || 'noreply@oversight.local'

  // Diagnostic checks
  const diagnostics = {
    apiKeyLength: apiKey?.length || 0,
    apiKeyValid: apiKey ? (apiKey.startsWith('re_') && apiKey.length > 20) : false,
    fromEmailSet: !!from,
  }

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY environment variable is not set', diagnostics)
    return {
      ok: false,
      error: 'RESEND_API_KEY not configured in Supabase Functions → Settings → Environment Variables',
      diagnostics,
    }
  }

  if (!diagnostics.apiKeyValid) {
    console.error('❌ RESEND_API_KEY format is invalid', {
      ...diagnostics,
      hint: 'API key should start with "re_" and be at least 40+ characters'
    })
    return {
      ok: false,
      error: `Invalid RESEND_API_KEY format. Key length: ${apiKey.length}, starts with: ${apiKey.substring(0, 5)}...`,
      diagnostics,
    }
  }

  console.log('✅ Environment variables configured:', {
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey.substring(0, 10) + '...',
    fromEmail: from,
  })

  console.log('📧 Attempting to send email via Resend:', {
    to,
    from,
    subject,
  })

  try {
    const requestBody = {
      from,
      to,
      subject,
      html,
      reply_to: from,
    }

    console.log('📤 Making request to Resend API endpoint: https://api.resend.com/emails')
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const responseBody = await resp.text()
    console.log('📨 Resend API response status:', resp.status)

    if (!resp.ok) {
      console.error('❌ Resend API returned error:', {
        status: resp.status,
        body: responseBody,
      })

      const diagnosticMsg = getDiagnosticMessage(resp.status, responseBody)
      diagnostics.resendStatusCode = resp.status
      diagnostics.resendErrorMessage = diagnosticMsg

      return {
        ok: false,
        error: diagnosticMsg,
        diagnostics,
      }
    }

    const data = JSON.parse(responseBody)
    console.log('✅ Email sent successfully via Resend:', {
      messageId: data.id,
      to,
      timestamp: new Date().toISOString(),
    })
    return { ok: true, data }
  } catch (error) {
    console.error('❌ Error communicating with Resend API:', {
      message: error.message,
      stack: error.stack,
    })
    return {
      ok: false,
      error: `Network error: ${error.message}`,
      diagnostics,
    }
  }
}

function getDiagnosticMessage(statusCode: number, body: string): string {
  switch (statusCode) {
    case 401:
      return 'RESEND_API_KEY is invalid or expired. Check Resend dashboard and update in Supabase Functions → Settings'
    case 403:
      return 'Sender email is not verified in Resend. Go to Resend Dashboard → Verified Domains & Senders to verify'
    case 422:
      return 'Invalid email format or domain issue. Check the email address and verify sender domain in Resend'
    case 429:
      return 'Rate limit exceeded. Too many requests to Resend API'
    case 500:
      return 'Resend service error. Try again in a few moments'
    default:
      return `Resend API error (${statusCode}): ${body.substring(0, 200)}`
  }
}

serve(async (req) => {
  console.log('Invitation email function called:', req.method)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    console.log('Request body:', {
      email: requestBody.email,
      role: requestBody.role,
      department: requestBody.department,
      hasInviteLink: !!requestBody.inviteLink,
    })

    const { email, inviteLink, role, inviterEmail, department } = requestBody

    if (!email || !inviteLink || !role) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: email, inviteLink, role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get email template from Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: template, error: templateError } = await supabaseClient
      .from('email_templates')
      .select('*')
      .eq('template_type', 'invitation')
      .eq('is_system', true)
      .single()

    if (templateError) {
      console.warn('Failed to get email template:', templateError)
    }

    // Default email content
    let emailSubject = 'Welcome to Oversight - Complete Your Account Setup'
    let emailBody = `<html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to Oversight!</h1>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            Dear ${email.split('@')[0]},
          </p>
          
          <p style="color: #333; font-size: 16px; line-height: 1.6;">
            You have been invited to join the <strong>Oversight Procurement Management System</strong> as a <strong>${role}</strong>.
          </p>
          
          <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #333; font-size: 16px; margin: 0 0 10px 0;">
              <strong>Complete Your Setup:</strong>
            </p>
            <a href="${inviteLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
              Accept Invitation & Create Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link: <br>
            <code style="background-color: #f5f5f5; padding: 10px; display: block; word-break: break-all; margin: 10px 0;">${inviteLink}</code>
          </p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #666; font-size: 14px; margin: 5px 0;">
              <strong>Your Role:</strong> ${role}
            </p>
            ${department ? `<p style="color: #666; font-size: 14px; margin: 5px 0;"><strong>Department:</strong> ${department}</p>` : ''}
            <p style="color: #666; font-size: 14px; margin: 5px 0;">
              <strong>Expires:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            This invitation link will expire in 7 days for security purposes.
          </p>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you have any questions, please contact your administrator:<br>
            <strong>${inviterEmail || 'admin@oversight.local'}</strong>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2024 Oversight Procurement Management System. All rights reserved.
          </p>
        </div>
      </body>
    </html>`

    // Use custom template if available
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
        .replace(/\n/g, '<br>')
    }

    console.log('Email prepared:', { to: email, subject: emailSubject })

    // Send email via Resend
    const sent = await sendWithResend(email, emailSubject, emailBody)

    if (sent.ok) {
      console.log('Email sent successfully:', { email, messageId: sent.data?.id })
      return new Response(
        JSON.stringify({
          success: true,
          provider: 'resend',
          messageId: sent.data?.id,
          message: 'Invitation email sent successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      console.error('Failed to send email:', sent.error)
      return new Response(
        JSON.stringify({
          success: false,
          provider: 'resend',
          error: sent.error,
          message: 'Failed to send invitation email'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Invitation email function error:', error.message, error.stack)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: String(error)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
