import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

interface GroundingSourcesProps {
  metadata: any;
}

export const GroundingSources: React.FC<GroundingSourcesProps> = ({ metadata }) => {
  if (!metadata || !metadata.groundingChunks) return null;

  const chunks = metadata.groundingChunks;

  // Extract web sources
  const webSources = chunks
    .filter((c: any) => c.web)
    .map((c: any) => c.web);
  
  // Extract map sources
    // Note: The specific shape of maps chunks can vary, but often they are web links in the current API version or distinct map chunks. 
    // We will treat typical web links.

  if (webSources.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-slate-200">
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sources & References</h4>
      <div className="flex flex-wrap gap-2">
        {webSources.map((source: any, idx: number) => (
          <a 
            key={idx}
            href={source.uri} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-full text-xs transition-colors border border-slate-200"
          >
            {source.uri.includes('maps') ? <MapPin size={12} /> : <ExternalLink size={12} />}
            <span className="truncate max-w-[150px]">{source.title || new URL(source.uri).hostname}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
