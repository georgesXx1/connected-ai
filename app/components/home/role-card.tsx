import Link from "next/link";

type RoleCardProps = {
  title: string;
  description: string;
  href: string;
};

export default function RoleCard({ title, description, href }: RoleCardProps) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10 block"
    >
      <div className="text-lg font-medium">{title}</div>
      <div className="mt-1 text-sm text-zinc-400">{description}</div>
    </Link>
  );
}