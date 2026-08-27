export default function Modal({ open, onClose, title, subtitle, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-ink/50 flex items-center justify-center z-50 p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl p-7 w-full max-w-md max-h-[88vh] overflow-y-auto animate-[modalIn_0.2s_ease]">
        <h3 className="text-lg font-semibold text-ink mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-ink/50 mb-5">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
