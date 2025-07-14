"use client"

export function MenuSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <div>
              <div className="w-40 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
              <div className="w-60 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
        </div>
        <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <div className="w-full h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Days skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Day header skeleton */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                <div>
                  <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                  <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Menu items skeleton */}
            <div className="p-4 space-y-6">
              {/* Almuerzos skeleton */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, itemIndex) => (
                    <div key={itemIndex} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                          <div className="w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </div>
                        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Colaciones skeleton */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                  <div className="w-20 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, itemIndex) => (
                    <div key={itemIndex} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                          <div className="w-8 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </div>
                        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-2/3 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                          <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
