import { checkHealth } from '@/server/health';

export async function GET() {
  return Response.json(await checkHealth());
}
