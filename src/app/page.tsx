import Link from "next/link";

const sections = [
  {
    href: "/inventory",
    title: "Inventory",
    description: "Browse and add clothing items",
  },
  {
    href: "/outfits",
    title: "Outfits",
    description: "Generate, complete, and save outfits",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-6 p-6 max-w-md mx-auto w-full">
      <header className="pt-8">
        <h1 className="text-3xl font-bold tracking-tight">wrdrb</h1>
        <p className="text-sm opacity-70 mt-1">
          Your wardrobe, matched by the rules.
        </p>
      </header>
      <nav className="flex flex-col gap-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-black/10 dark:border-white/15 p-4 active:scale-[0.99] transition-transform"
          >
            <div className="font-semibold">{s.title}</div>
            <div className="text-sm opacity-70">{s.description}</div>
          </Link>
        ))}
      </nav>
    </main>
  );
}
