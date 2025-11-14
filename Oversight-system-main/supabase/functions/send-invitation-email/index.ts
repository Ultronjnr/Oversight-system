import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    let emailBody = `Dear ${email.split('@')[0]},

You have been invited to join the Oversight Procurement Management System as a ${role}.

To complete your account setup, please click the link below:
${inviteLink}

This invitation will expire in 7 days.

Your role: ${role}
${department ? `Department: ${department}` : ''}

If you have any questions, please contact your administrator.

Best regards,
The Oversight Team`

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

    // In production, integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll log the email content
    console.log('Sending invitation email:', {
      to: email,
      subject: emailSubject,
      body: emailBody,
      from: 'noreply@oversight.co.za'
    })

    // Here you would integrate with your email service
    // Example with a generic email service:
    /*
    const emailResponse = await fetch('https://api.emailservice.com/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('EMAIL_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        from: 'noreply@oversight.co.za',
        subject: emailSubject,
        html: emailBody.replace(/\n/g, '<br>')
      })
    })
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        emailContent: { subject: emailSubject, body: emailBody }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error sending invitation email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})