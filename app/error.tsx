"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="rounded-card bg-white px-6 py-5 text-center shadow-card">
        <p className="mb-4 font-bold text-ink">잠시 문제가 생겼어요.</p>
        <button onClick={reset} className="rounded-button bg-mingle px-5 py-3 font-bold text-white">
          다시 시도
        </button>
      </div>
    </main>
  );
}
