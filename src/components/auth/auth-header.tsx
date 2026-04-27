interface AuthHeaderProps {
  title: string;
  description: string;
}

export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="mb-6 space-y-1">
      <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  );
}
