import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { ts?: number; text?: string }
    if (!body?.text) {
      return NextResponse.json({ ok: false, error: 'missing text' }, { status: 400 })
    }
    // Here you can fan-out to your classifier, logs, etc.
    // For now, just echo back.
    return NextResponse.json({ ok: true, length: body.text.length, ts: body.ts ?? Date.now() })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}


