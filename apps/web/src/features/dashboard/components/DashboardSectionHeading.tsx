type DashboardSectionHeadingProps = {
  headingId: string;
  eyebrow: string;
  title: string;
  description: string;
};

/**
 * Shared heading for dashboard sections.
 */
export function DashboardSectionHeading({
  headingId,
  eyebrow,
  title,
  description,
}: DashboardSectionHeadingProps) {
  return (
    <div>
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </p>

      <h2
        id={headingId}
        className="mt-2 font-display text-xl font-black uppercase tracking-[0.04em] text-white"
      >
        {title}
      </h2>

      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}