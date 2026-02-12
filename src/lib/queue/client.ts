import { Client } from '@upstash/qstash';

const client = new Client({
  token: process.env.QSTASH_TOKEN || '',
});

export const publishJob = async (destinationUrl: string, payload: unknown) => {
  if (!process.env.QSTASH_TOKEN) {
    console.warn('QSTASH_TOKEN is not set. Skipping queue publication.');
    return;
  }

  try {
    const res = await client.publishJSON({
      url: destinationUrl,
      body: payload,
    });
    return res;
  } catch (error) {
    console.error('Failed to publish to QStash:', error);
    throw error;
  }
};
