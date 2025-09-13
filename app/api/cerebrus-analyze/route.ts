import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { text?: string }
    if (!body?.text) {
      return NextResponse.json({ ok: false, error: 'missing text' }, { status: 400 })
    }

    const text = body.text.trim()
    if (text.length < 10) {
      return NextResponse.json({ ok: false, error: 'text too short' }, { status: 400 })
    }

    // Call the Python Cerebrus script
    return new Promise((resolve) => {
      const python = spawn('python3', ['-c', `
import sys
sys.path.append('${process.cwd().replace(/\\/g, '\\\\')}')
from cerebrus.cerebras_vibe_compressor import CerebrasVibeCompressor
import json
import os

try:
    compressor = CerebrasVibeCompressor(enable_logging=False)
    result = compressor.compress("""${text.replace(/"/g, '\\"')}""")
    
    if result.success:
        print(json.dumps({
            "ok": True, 
            "data": result.data,
            "processing_time": result.processing_time,
            "tokens_used": result.tokens_used
        }))
    else:
        print(json.dumps({
            "ok": False,
            "error": result.error_message
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
