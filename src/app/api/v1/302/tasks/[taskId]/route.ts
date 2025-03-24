import { NextRequest, NextResponse } from "next/server";

// 获取环境变量
const API_KEY = process.env.API_302_KEY;
const BASE_URL = process.env.API_302_BASE_URL || "https://api.302.ai";

if (!API_KEY) {
  console.error("Missing API key for 302");
}

// 使用类型断言避开类型检查问题
type RouteParams = { params: { taskId: string } };

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // 获取路由参数中的taskId
    const { taskId } = context.params;
    
    // 调用 Kling AI 的实际 API
    const response = await fetch(`${BASE_URL}/klingai/task/${taskId}/fetch`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
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