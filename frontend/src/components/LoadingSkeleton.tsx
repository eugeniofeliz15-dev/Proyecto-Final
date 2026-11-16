interface LoadingSkeletonProps {
  cards?: number;
}

export function LoadingSkeleton({ cards = 6 }: LoadingSkeletonProps) {
  return (
    <section
      aria-label="Cargando productos"
      aria-busy="true"
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: cards }, (_, index) => (
        <article
          className="animate-pulse rounded-3xl border border-slate-100 bg-white p-5 shadow-card"
          key={index}
        >
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="mt-5 h-4 w-2/3 rounded bg-slate-100" />
          <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
          <div className="mt-6 h-10 rounded-xl bg-slate-100" />
        </article>
      ))}
    </section>
  );
}
