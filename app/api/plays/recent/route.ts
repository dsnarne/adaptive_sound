import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!user_id) {
      return NextResponse.json({ ok: false, error: 'missing user_id' }, { status: 400 })
    }

    // Get Modal endpoint URL from environment (function-specific URL)
    const modalGetPlaysUrl = process.env.MODAL_GET_PLAYS_URL || process.env.MODAL_ENDPOINT_URL + '/plays'
    const authToken = process.env.MODAL_AUTH_TOKEN || 'demo-token-12345'

    // Call Modal web endpoint directly
    const response = await fetch(`${modalGetPlaysUrl}?user_id=${user_id}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Modal API error: ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json({ ok: true, data: result })

  } catch (e) {
    console.error('Fetch recent plays error:', e)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
