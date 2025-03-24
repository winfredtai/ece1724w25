import { NextRequest, NextResponse } from "next/server";
import { getProviderByModel } from "@/lib/providers";

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const model = searchParams.get('model') || 'kling';

    // 获取供应商信息
    const providerInfo = getProviderByModel(model);
    if (!providerInfo) {
      return NextResponse.json(
        { success: false, error: "不支持的模型类型" },
        { status: 400 }
      );
    }

    if (model === 'kling') {
      // 调用 Kling 的内部 API
      const response = await fetch(`${request.nextUrl.origin}/api/v1/302/tasks/${taskId}`, {
        method: 'GET',
      });

      const data = await response.json();

      // 添加供应商信息到响应中，但不包含详细的模型信息
      return NextResponse.json({
        ...data,
        provider: providerInfo.provider
      });
    }

    return NextResponse.json(
      { success: false, error: "不支持的模型类型" },
      { status: 400 }
    );

  } catch (error) {
    console.error('Task status check error:', error);
    return NextResponse.json(
      { success: false, error: "任务状态查询失败" },
      { status: 500 }
    );
  }
} 