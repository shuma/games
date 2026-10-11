export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="type-xs text-muted-foreground">{label}</span>
      <span className="type-l font-(--weight-data-heavy) tabular-nums">{value.toLocaleString()}</span>
    </div>
  )
}
