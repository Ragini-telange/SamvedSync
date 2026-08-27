export default function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] font-semibold text-ink/60 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full text-[15px] px-3.5 py-2.5 border border-ink/10 rounded-md bg-white text-ink focus:outline-none focus:border-saline transition-colors';
