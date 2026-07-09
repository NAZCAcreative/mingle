export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="rounded-card bg-white px-6 py-5 text-center shadow-card">
        <div className="mx-auto mb-3 h-10 w-10 animate-pulse rounded-full bg-blush" />
        <p className="font-bold text-ink">방을 불러오는 중이에요</p>
      </div>
    </main>
  );
}
