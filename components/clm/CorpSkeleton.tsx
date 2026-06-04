interface CorpSkeletonProps {
  className?: string;
}

export function CorpSkeleton({ className = "h-24" }: CorpSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-corp border border-corp-border bg-corp-surface ${className}`.trim()}
    />
  );
}

export function CorpSkeletonGrid({
  count = 4,
  itemClassName = "h-36",
}: {
  count?: number;
  itemClassName?: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2" role="status" aria-label="Cargando contenido">
      {Array.from({ length: count }).map((_, index) => (
        <CorpSkeleton key={index} className={itemClassName} />
      ))}
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
