import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function POST(req: Request) {
  try {
    const { name, phone, email, message } = await req.json();

    if (!name || !phone || !email || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Sabaah <onboarding@resend.dev>',
        to: 'sabaah.net@gmail.com',
        subject: `📬 رسالة جديدة من ${name}`,
        html: `
          <h2>رسالة جديدة من نموذج التواصل</h2>
          <p><strong>الاسم:</strong> ${name}</p>
          <p><strong>الهاتف:</strong> ${phone}</p>
          <p><strong>البريد:</strong> ${email}</p>
          <p><strong>الرسالة:</strong></p>
          <p>${message}</p>
        `,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
