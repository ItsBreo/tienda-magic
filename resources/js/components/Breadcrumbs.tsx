import { Link } from 'react-router-dom';
import { type BreadcrumbItem } from '@/types';

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 py-2">
        <nav className="flex items-center gap-2 text-sm">
          {items.map((breadcrumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-zinc-700">/</span>
              )}
              <Link
                to={breadcrumb.href}
                className="text-zinc-400 hover:text-amber-500 transition-colors duration-200"
              >
                {breadcrumb.title}
              </Link>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
