import React from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';

interface Platform {
  name: string;
  tagline: string;
  url: string;
  badge?: string;
  primary?: boolean;
}

const AI_PLATFORMS: Platform[] = [
  {
    name: 'Google Gemini',
    tagline: 'Text & Multimodal AI',
    url: 'https://gemini.google.com/app',
    badge: 'Popular',
    primary: true
  },
  {
    name: 'ChatGPT',
    tagline: 'OpenAI GPT-4o & DALL-E',
    url: 'https://chatgpt.com',
    badge: 'Popular',
    primary: true
  },
  {
    name: 'Google AI Studio',
    tagline: 'Gemini Developer Studio',
    url: 'https://aistudio.google.com/prompts/new_chat',
    primary: true
  },
  {
    name: 'Grok AI',
    tagline: 'xAI Reasoning & Vision',
    url: 'https://x.com/i/grok',
    primary: true
  },
  {
    name: 'Google Flow',
    tagline: 'Google Labs AI Workflow',
    url: 'https://labs.google/flow',
    primary: true
  },
  {
    name: 'Midjourney',
    tagline: 'Photorealistic Art Generation',
    url: 'https://www.midjourney.com',
    badge: 'Photo'
  },
  {
    name: 'Claude',
    tagline: 'Anthropic Assistant',
    url: 'https://claude.ai/new',
    badge: 'Claude 3.7'
  },
  {
    name: 'Runway',
    tagline: 'Gen-3 AI Video Suite',
    url: 'https://runwayml.com',
    badge: 'Video'
  }
];

export const PlatformShortcuts: React.FC = () => {
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Open AI Platform to Paste Prompt:
        </h3>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          Opens in a new tab &middot; Paste prompt once opened
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {AI_PLATFORMS.map((platform) => (
          <a
            key={platform.name}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col p-2.5 sm:p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200/90 hover:border-blue-300 rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                {platform.name}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
            </div>
            <div className="flex items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-500 truncate group-hover:text-slate-600">
                {platform.tagline}
              </span>
              {platform.badge && (
                <span className="px-1.5 py-0.2 bg-white text-blue-700 font-semibold text-[9px] rounded border border-slate-200 uppercase flex-shrink-0">
                  {platform.badge}
                </span>
              )}
            </div>
          </a>
        ))}
      </div>

      <p className="mt-2.5 text-[11px] text-slate-400 leading-normal">
        Tip: Click the &quot;Copy Prompt&quot; button above, then select your desired AI platform to generate your image or video.
      </p>
    </div>
  );
};
