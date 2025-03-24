import { NextRequest, NextResponse } from "next/server";

// 获取环境变量
const apiKey = process.env.API_302_KEY;
const baseUrl = process.env.API_302_BASE_URL;

if (!apiKey || !baseUrl) {
  throw new Error("Missing required environment variables for 302 API");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // 这里添加实际的 API 调用逻辑
    const response = await fetch(`${baseUrl}/image2video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      // 直接传递 FormData
      body: formData,
    });

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Image to video generation error:', error);
    return NextResponse.json(
      { success: false, error: "处理失败" },
      { status: 500 }
    );
  }
} 