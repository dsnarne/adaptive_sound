import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, play_record } = body
    
    if (!user_id || !play_record) {
      return NextResponse.json({ ok: false, error: 'missing user_id or play_record' }, { status: 400 })
    }

    // Get Modal endpoint URL from environment (function-specific URL)
    const modalRecordUrl = process.env.MODAL_RECORD_PLAY_URL || (process.env.MODAL_ENDPOINT_URL ? process.env.MODAL_ENDPOINT_URL + '/plays' : undefined)
    const authToken = process.env.MODAL_AUTH_TOKEN || 'demo-token-12345'

    // If no Modal endpoint configured, act as a no-op to avoid dev errors
    if (!modalRecordUrl) {
      return NextResponse.json({ ok: true, data: { noop: true } })
    }

    // Call Modal web endpoint directly
    const response = await fetch(modalRecordUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        user_id,
        play_record
      })
    })

    if (!response.ok) {
      throw new Error(`Modal API error: ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json({ ok: true, data: result })

  } catch (e) {
    console.error('Record play error:', e)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
