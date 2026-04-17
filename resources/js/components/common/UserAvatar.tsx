import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  initials?: string;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
}

export function UserAvatar({
  src,
  name,
  initials,
  className,
  fallbackClassName,
  imageClassName,
}: UserAvatarProps) {
  const displayInitials = initials || (name ? name.substring(0, 2).toUpperCase() : "??");

  return (
    <div className={cn("relative flex-shrink-0 overflow-hidden", className)}>
      {src ? (
        <img
          src={src}
          alt={name || "User Avatar"}
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            (e.target as HTMLImageElement).nextElementSibling?.classList.add('flex');
          }}
        />
      ) : null}
      
      <div
        className={cn(
          "h-full w-full items-center justify-center font-black",
          src ? "hidden" : "flex",
          fallbackClassName
        )}
      >
        {displayInitials}
      </div>
    </div>
  );
}
