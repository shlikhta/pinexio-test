import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center dark:bg-gray-950">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        Page not found
      </h1>
      <p className="max-w-md text-gray-600 dark:text-gray-300">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Link
        href="/docs/home"
        className="flex h-11 items-center justify-center rounded-lg border bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        На головну
      </Link>
    </div>
  );
}
