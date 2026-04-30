/**
 * 7 curated Microsoft Edge Neural voices. The "Multilingual" variants are the
 * newer HD models — they sound noticeably more human and emotionally varied
 * than the older Neural voices. Mixed gender / tone so users can pick what
 * feels like a real interviewer.
 *
 * All voices are free via Microsoft's Edge TTS endpoint (no API key required).
 * msedge-tts speaks WSS to that endpoint.
 */
export interface InterviewerVoice {
  id: string;
  name: string;
  gender: 'female' | 'male';
  vibe: string;
  msVoice: string;
  rate?: string; // e.g. "+0%" or "-10%"
  pitch?: string; // e.g. "+0Hz" or "+5Hz"
}

export const INTERVIEWER_VOICES: InterviewerVoice[] = [
  {
    id: 'aria',
    name: 'Aria',
    gender: 'female',
    vibe: 'Warm, professional — think a friendly recruiter at a mid-size tech co',
    msVoice: 'en-US-AriaNeural',
  },
  {
    id: 'andrew',
    name: 'Andrew',
    gender: 'male',
    vibe: 'Conversational, thoughtful — newer HD voice, very human',
    msVoice: 'en-US-AndrewMultilingualNeural',
  },
  {
    id: 'ava',
    name: 'Ava',
    gender: 'female',
    vibe: 'Casual, curious — like a peer-level engineer doing the screen',
    msVoice: 'en-US-AvaMultilingualNeural',
  },
  {
    id: 'brian',
    name: 'Brian',
    gender: 'male',
    vibe: 'Calm, deliberate — senior staff vibe, asks deep follow-ups',
    msVoice: 'en-US-BrianMultilingualNeural',
  },
  {
    id: 'emma',
    name: 'Emma',
    gender: 'female',
    vibe: 'Friendly, encouraging — early-career-friendly interviewer',
    msVoice: 'en-US-EmmaMultilingualNeural',
  },
  {
    id: 'davis',
    name: 'Davis',
    gender: 'male',
    vibe: 'Energetic, fast-paced — startup CTO style',
    msVoice: 'en-US-DavisNeural',
  },
  {
    id: 'jenny',
    name: 'Jenny',
    gender: 'female',
    vibe: 'Supportive, patient — good for first-timers',
    msVoice: 'en-US-JennyNeural',
  },
];

export function getVoice(id: string): InterviewerVoice {
  return INTERVIEWER_VOICES.find((v) => v.id === id) ?? INTERVIEWER_VOICES[0];
}
