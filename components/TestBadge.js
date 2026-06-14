/**
 * Tiny pill that flags seeded test data so users don't mistake it for a
 * real lost/found pet report.
 *
 * Renders nothing when `show` is falsy, so call sites can write:
 *   <TestBadge show={pet.is_test} />
 * without worrying about conditional JSX.
 */
export default function TestBadge({ show = true, className = "" }) {
  if (!show) return null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-yellow-400 text-black ${className}`}
      title="Test data - not a real pet report"
    >
      TEST
    </span>
  );
}
