'use client';

interface Props {
  context: string;
  label?: string;
}

export default function ReflectWithAI({ context, label = 'Reflect with AI' }: Props) {
  const handleOpen = () => {
    const prompt = encodeURIComponent(context);
    // Copy to clipboard then open ChatGPT
    if (navigator.clipboard) {
      navigator.clipboard.writeText(context).catch(() => {});
    }
    // Try ChatGPT app deep link, fallback to web
    const chatgptApp = `chatgpt://chat?text=${prompt}`;
    const chatgptWeb = `https://chat.openai.com/`;

    const win = window.open(chatgptApp, '_blank');
    setTimeout(() => {
      // If app didn't open, go to web
      if (!win || win.closed) {
        window.open(chatgptWeb, '_blank');
      }
    }, 1500);
  };

  return (
    <button
      onClick={handleOpen}
      className="flex items-center gap-2 text-sm text-warm-500 hover:text-sage transition-colors py-1"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span>{label}</span>
      <span className="text-xs text-warm-300">(copied to clipboard)</span>
    </button>
  );
}
