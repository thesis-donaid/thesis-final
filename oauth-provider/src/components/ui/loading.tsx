import { Loader2 } from "lucide-react";
import { cn } from "./utils";

interface LoadingProps {
  loadingName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "button" | "fullscreen" | "overlay";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export function Loading({ 
  loadingName, 
  size = "md", 
  variant = "default",
  className 
}: LoadingProps) {
  
  // For button variant - inline loading with text
  if (variant === "button") {
    return (
      <div className="flex items-center justify-center gap-2">
        <Loader2 className={cn("animate-spin", sizeMap[size], className)} />
        {loadingName && (
          <span className="text-sm font-medium">{loadingName}</span>
        )}
      </div>
    );
  }

  // For fullscreen variant - covers entire screen
  if (variant === "fullscreen") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-xl">
          <Loader2 className={cn("animate-spin text-red-600", sizeMap[size])} />
          {loadingName && (
            <p className="text-lg font-semibold text-gray-900">{loadingName}</p>
          )}
        </div>
      </div>
    );
  }

  // For overlay variant - covers parent container
  if (variant === "overlay") {
    return (
      <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className={cn("animate-spin text-red-600", sizeMap[size])} />
          {loadingName && (
            <p className="text-sm font-medium text-gray-700">{loadingName}</p>
          )}
        </div>
      </div>
    );
  }

  // Default variant - simple centered loading
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn("animate-spin text-red-600", sizeMap[size], className)} />
      {loadingName && (
        <p className="text-gray-600">{loadingName}</p>
      )}
    </div>
  );
}

// Specialized Button Loading Component
export function ButtonLoading({ 
  loadingName = "Please wait...", 
  size = "sm" 
}: LoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={cn("animate-spin", sizeMap[size])} />
      <span>{loadingName}</span>
    </div>
  );
}

// Page Loading Component (for Suspense fallback)
export function PageLoading({ loadingName = "Loading page..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{loadingName}</p>
      </div>
    </div>
  );
}

// Card Loading Component
export function CardLoading({ loadingName = "Loading content..." }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <p className="text-gray-600">{loadingName}</p>
      </div>
    </div>
  );
}