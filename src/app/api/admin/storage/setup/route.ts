import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const REQUIRED_BUCKETS = [
  { name: 'avatars', public: true },
  { name: 'portfolio', public: true },
  { name: 'recent-work', public: true },
]

export async function POST() {
  try {
    const supabase = createClient()

    // Check auth via service role only for server route
    // Create buckets if not present
    const created: string[] = []
    const skipped: string[] = []

    for (const b of REQUIRED_BUCKETS) {
      const { error } = await supabase.storage.createBucket(b.name, {
        public: b.public,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5 * 1024 * 1024,
      })
      if (error) {
        if (error.message?.includes('already exists')) {
          skipped.push(b.name)
        } else {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      } else {
        created.push(b.name)
      }
    }

    return NextResponse.json({ created, skipped })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to setup storage' }, { status: 500 })
  }
}

// Convenience: allow GET to perform the same setup so you can visit in a browser
export async function GET() {
  return POST()
}


