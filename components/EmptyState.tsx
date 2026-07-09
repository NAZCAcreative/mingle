import { Mascot } from "@/components/Mascot";

export function EmptyState() {
  return (
    <div className="mx-4 mt-4 rounded-card bg-white p-8 text-center shadow-card">
      <div className="mx-auto w-fit">
        <Mascot />
      </div>
      <p className="mt-4 font-semibold text-ink">조건에 맞는 방이 없어요.</p>
      <p className="mt-1 text-sm font-semibold text-muted">새로고침하면 막 만들어진 방이 나타날 수 있어요.</p>
    </div>
  );
}
