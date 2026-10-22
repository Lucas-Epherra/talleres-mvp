import { LockKeyhole } from "lucide-react";

type RoleRestrictedNoticeProps = {
  /**
   * Describes what the current role cannot do, e.g. "anular o reabrir órdenes".
   */
  action: string;
  className?: string;
};

/**
 * Explains why an administrative action is not available for the current
 * workshop role, instead of silently hiding it.
 */
export function RoleRestrictedNotice({
  action,
  className,
}: RoleRestrictedNoticeProps) {
  return (
    <p
      className={[
        "flex items-start gap-2.5 rounded-2xl border border-border bg-surface-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <LockKeyhole
        className="mt-1 size-4 shrink-0 text-primary"
        aria-hidden="true"
      />
      <span>
        Solo el responsable del taller o administración pueden {action}.
      </span>
    </p>
  );
}
