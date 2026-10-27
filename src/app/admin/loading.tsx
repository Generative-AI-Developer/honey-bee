export default function AdminLoading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-card" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-card" />
    </div>
  );
}
