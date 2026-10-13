import React, { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  buttonLabel?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  className = '',
  buttonLabel = 'Copy Prompt'
}) => {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for non-https or older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        textArea.remove();
        if (!successful) throw new Error('Copy command failed');
      }

      setStatus('copied');
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to copy prompt:', err);
      setStatus('error');
      setErrorMessage(err?.message || 'Failed to copy prompt to clipboard');
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 4000);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
      <button
        type="button"
        onClick={handleCopy}
        disabled={status === 'copied'}
        className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer ${
          status === 'copied'
            ? 'bg-emerald-600 text-white shadow-emerald-500/20'
            : status === 'error'
            ? 'bg-red-600 text-white shadow-red-500/20'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
        } ${className}`}
      >
        {status === 'copied' ? (
          <>
            <Check className="w-4 h-4 animate-scale-in" />
            <span>Prompt Copied!</span>
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="w-4 h-4" />
            <span>Copy Failed</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>{buttonLabel}</span>
          </>
        )}
      </button>

      {/* Confirmation Message */}
      {status === 'copied' && (
        <span className="text-xs sm:text-sm font-semibold text-emerald-600 flex items-center gap-1.5 animate-fade-in bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
          <Check className="w-3.5 h-3.5" />
          Prompt copied successfully! Ready to paste into AI tools.
        </span>
      )}

      {/* Error Message */}
      {status === 'error' && (
        <span className="text-xs sm:text-sm font-semibold text-red-600 flex items-center gap-1.5 animate-fade-in bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
          <AlertCircle className="w-3.5 h-3.5" />
          {errorMessage || 'Unable to copy. Please manually select and copy the text.'}
        </span>
      )}
    </div>
  );
};
