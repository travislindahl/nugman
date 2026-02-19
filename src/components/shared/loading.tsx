import { Spinner } from "@inkjs/ui";

interface LoadingProps {
  readonly message?: string;
}

export function Loading({ message = "Loading..." }: LoadingProps): React.ReactNode {
  return <Spinner label={message} />;
}
