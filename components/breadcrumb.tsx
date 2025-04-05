import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="separator h-4 w-4" />}

            {isLast || !item.href ? (
              <span className="current">{item.label}</span>
            ) : (
              <Link href={item.href}>{item.label}</Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

