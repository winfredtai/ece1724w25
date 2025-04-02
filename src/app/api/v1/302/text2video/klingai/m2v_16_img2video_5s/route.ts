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

    const formData = await request.formData();
    const inputImage = formData.get('input_image') as File;
    const prompt = formData.get('prompt') as string;
    const negativePrompt = formData.get('negative_prompt') as string;
    const cfg = formData.get('cfg') as string;
    const aspectRatio = formData.get('aspect_ratio') as string;

    // Validate required fields
    if (!inputImage) {
      return NextResponse.json(
        { success: false, error: "input_image is required" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (inputImage.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Image size must not exceed 10MB" },
        { status: 400 }
      );
    }

    // Create FormData for the API request
    const apiFormData = new FormData();
    apiFormData.append('input_image', inputImage);
    
    if (prompt) apiFormData.append('prompt', prompt);
    if (negativePrompt) apiFormData.append('negative_prompt', negativePrompt);
    if (cfg) {
      const cfgValue = parseFloat(cfg);
      if (cfgValue >= 0 && cfgValue <= 1) {
        apiFormData.append('cfg', cfg);
      }
    }
    if (aspectRatio) {
      const validRatios = ['1:1', '16:9', '9:16'];
      if (validRatios.includes(aspectRatio)) {
        apiFormData.append('aspect_ratio', aspectRatio);
      }
    }

    const response = await fetch(`${BASE_URL}/klingai/m2v_16_img2video_5s`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: apiFormData
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