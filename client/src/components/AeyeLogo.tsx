export function AeyeLogo({ className }: { className?: string }) {
  return (
    <div className="inline-flex flex-col items-center">
      <picture className={className}>
        <source
          type="image/webp"
          srcSet="/brand/aeye-wordmark.webp 1x, /brand/aeye-wordmark@2x.webp 2x"
        />
        <img
          src="/brand/aeye-wordmark.png"
          srcSet="/brand/aeye-wordmark@2x.png 2x"
          alt="AEYE"
          className="h-full w-auto"
          loading="eager"
          decoding="async"
        />
      </picture>
      <span className="mt-0.5 text-[10px] leading-none text-slate-500 dark:text-slate-400">
        AI-guided retinal screening
      </span>
    </div>
  );
}
