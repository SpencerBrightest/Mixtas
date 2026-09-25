// Root 404 page for handling non-existent URL requests cleanly.

import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'

/** Renders page-not-found layout. */
export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#f4f3f0] flex flex-col justify-center items-center p-4 text-[#182938]">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#dedfdd] p-8 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#f4f3f0] text-[#5d85a0] flex items-center justify-center mx-auto border border-[#dedfdd]">
          <Compass className="w-6 h-6" />
        </div>

        <h1 className="font-serif text-3xl text-[#182938]">Page Not Found</h1>
        <p className="text-xs text-[#727677]">
          The piece or page you are looking for does not exist or has been moved.
        </p>

        <div className="pt-2">
          <Link
            href="/shop"
            className="w-full bg-[#182938] hover:bg-[#5d85a0] text-white text-xs uppercase tracking-wider py-3 rounded font-medium transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Explore Shop Collection
          </Link>
        </div>
      </div>
    </div>
  )
}
