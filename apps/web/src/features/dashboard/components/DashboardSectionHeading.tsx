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
      <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-primary">
        {eyebrow}
      </p>

      <h2
        id={headingId}
        className="mt-1.5 font-display text-lg font-black uppercase tracking-[0.04em] text-foreground"
      >
        {title}
      </h2>

      <p className="mt-1 text-sm leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
