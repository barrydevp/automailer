export const When = ({
  truthy,
  children,
  fallback = null,
}: {
  truthy: boolean;
  children: React.ReactNode;
  fallback: React.ReactNode | null;
}) => (truthy ? children : fallback);
