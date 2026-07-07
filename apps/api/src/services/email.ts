/**
 * Transactional email. Uses Resend (Vercel-native) when RESEND_API_KEY is set;
 * otherwise logs the message so the auth flows are fully testable in local dev
 * without any provider configured. Swap this one function to change providers.
 */
interface Mail {
  to: string;
  subject: string;
  text: string;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export async function sendMail(mail: Mail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? 'Vector <onboarding@resend.dev>';

  if (!apiKey) {
    // Unconfigured (local dev): never fail the request — log so the code is usable.
    console.log(
      `[email:dev] to=${mail.to} subject="${mail.subject}"\n${mail.text}`,
    );
    return;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from, to: mail.to, subject: mail.subject, text: mail.text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`email send failed: ${res.status} ${body}`);
  }
}
