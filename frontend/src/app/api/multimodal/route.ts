import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Proxy to backend FastAPI multimodal endpoint
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/multimodal/process`, {
      method: 'POST',
      body: req.body,
      headers: {
        ...req.headers,
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await backendResponse.json();
    
    return NextResponse.json(data, {
      status: backendResponse.status,
    });
  } catch (error) {
    console.error('Multimodal proxy error:', error);
    return NextResponse.json(
      { error: 'Multimodal processing unavailable' },
      { status: 500 }
    );
  }
}

