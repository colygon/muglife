export default function MugLoading() {
  return (
    <div className="min-h-screen bg-[#1a1107] text-white font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-32">
        {/* Avatar skeleton */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full bg-white/5 animate-pulse mb-4" />
          <div className="h-8 w-40 bg-white/5 rounded animate-pulse mb-2" />
          <div className="h-5 w-32 bg-white/5 rounded animate-pulse mb-4" />
          <div className="flex gap-4">
            <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
            <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
          </div>
        </div>

        {/* Timeline skeleton */}
        <div className="mb-8">
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse mb-2" />
                <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
