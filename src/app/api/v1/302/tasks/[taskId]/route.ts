import { NextRequest, NextResponse } from "next/server";

// 获取环境变量
const apiKey = process.env.API_302_KEY;
const baseUrl = process.env.API_302_BASE_URL;

if (!apiKey || !baseUrl) {
  throw new Error("Missing required environment variables for 302 API");
}

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = await params;
    
    // 调用 Kling AI 的实际 API
    const response = await fetch(`${baseUrl}/klingai/task/${taskId}/fetch`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // 处理非 2xx 响应
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.message || "状态查询失败" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // 返回标准化的响应格式
    return NextResponse.json({
      success: true,
      model: {
        name: "Text to Video 1.0 Rapid-5s",
        version: "1.0",
        duration: 5,
        isHQ: false
      },
      data: data
    });
  } catch (error) {
    console.error('Task status check error:', error);
    return NextResponse.json(
      { success: false, error: "状态查询失败" },
      { status: 500 }
    );
  }
} 