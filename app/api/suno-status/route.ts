import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({})) as { clip_id?: string }
    if (!body?.clip_id) {
      return NextResponse.json({ ok: false, error: 'missing clip_id' }, { status: 400 })
    }

    const { clip_id } = body
    
    // Call the Python Suno script to check status
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
    clip = suno._get_clip_status("${clip_id}")
    
    if not clip:
        print(json.dumps({
            "ok": False,
            "error": "Clip not found"
        }))
        sys.exit(0)
    
    status = clip.get("status")
    audio_url = clip.get("audio_url") if status in ["streaming", "complete"] else None
    
    print(json.dumps({
        "ok": True,
        "status": status,
        "audio_url": audio_url,
        "title": clip.get("title"),
        "metadata": clip.get("metadata", {})
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
