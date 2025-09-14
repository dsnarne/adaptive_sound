import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({})) as { topics?: string; tags?: string }
    if (!body?.topics || !body?.tags) {
      return NextResponse.json({ ok: false, error: 'missing topics or tags' }, { status: 400 })
    }

    const { topics, tags } = body
    
    // Call the Python Suno script
    return new Promise<NextResponse>((resolve) => {
      const python = spawn('python3', ['-c', `
import sys
sys.path.append('${path.join(process.cwd(), 'suno')}')
from suno import SunoAPI
import json
import os

try:
    api_token = os.getenv("SUNO_API_TOKEN")
    if not api_token:
        print(json.dumps({
            "ok": False,
            "error": "SUNO_API_TOKEN environment variable not set"
        }))
        sys.exit(0)
    
    suno = SunoAPI(api_token)
    
    # Generate song with instrumental=True for background music
    clip_info = suno.generate_song("${topics.replace(/"/g, '\\"')}", "${tags.replace(/"/g, '\\"')}", make_instrumental=True)
    
    print(json.dumps({
        "ok": True,
        "clip_id": clip_info.get("id"),
        "status": "generating",
        "message": "Song generation started"
    }))
    
except Exception as e:
    print(json.dumps({
        "ok": False,
        "error": str(e)
    }))
`])

      let output = ''
      let errorOutput = ''
      
      python.stdout.on('data', (data) => {
        output += data.toString()
      })
      
      python.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })
      
      python.on('close', (code) => {
        if (code !== 0) {
          resolve(NextResponse.json({ 
            ok: false, 
            error: `Python script failed: ${errorOutput}` 
          }, { status: 500 }))
          return
        }
        
        try {
          const result = JSON.parse(output.trim())
          resolve(NextResponse.json(result))
        } catch (e) {
          resolve(NextResponse.json({ 
            ok: false, 
            error: `Failed to parse output: ${output}` 
          }, { status: 500 }))
        }
      })
    })
    
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
