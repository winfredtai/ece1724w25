import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const API_KEY = process.env.API_302_KEY;
    const BASE_URL = process.env.API_302_BASE_URL;

    if (!API_KEY || !BASE_URL) {
      console.error('Missing environment variables:', { 
        hasApiKey: !!API_KEY, 
        hasBaseUrl: !!BASE_URL 
      });
      return NextResponse.json(
        { success: false, error: "API configuration missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('Received request body:', body);
    
    const response = await fetch(`${BASE_URL}/klingai/m2v_16_txt2video_5s`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    console.log('API response:', { 
      status: response.status,
      data 
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.message || "Request failed", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 