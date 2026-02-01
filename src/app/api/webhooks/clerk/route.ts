import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import prisma from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new NextResponse('Missing webhook secret', { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Missing svix headers', { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let event: WebhookEvent;

  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error verifying webhook', { status: 400 });
  }

  // Handle the event
  const eventType = event.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const email = email_addresses?.[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ') || null;

    try {
      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email: email || '',
          name,
          imageUrl: image_url,
        },
        create: {
          clerkId: id,
          email: email || '',
          name,
          imageUrl: image_url,
        },
      });

      console.log(`User ${eventType}: ${id}`);
    } catch (error) {
      console.error('Error upserting user:', error);
      return new NextResponse('Error processing user', { status: 500 });
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = event.data;

    try {
      await prisma.user.delete({
        where: { clerkId: id },
      });
      console.log(`User deleted: ${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      // User might not exist, that's ok
    }
  }

  return new NextResponse('OK', { status: 200 });
}
