import { getSearchIndexJSON } from '@/lib/search-index';

export async function GET() {
  return new Response(getSearchIndexJSON(), {
    headers: { 'Content-Type': 'application/json' },
  });
}
