import { NextRequest, NextResponse } from "next/server";

// 模型配置
const MODEL_CONFIG = {
  name: "Text to Video 1.0 Rapid-5s",
  version: "1.0",
  duration: 5, // 视频时长（秒）
  isHQ: false, // 是否是高清版本
  endpoint: "klingai/m2v_txt2video"
};

// 定义请求参数的类型
interface KlingTextToVideoParams {
  prompt: string;                 // 必需：视频提示词
  negative_prompt?: string;       // 可选：负面提示词，用于排除不想要的内容
  cfg?: number;                   // 可选：创造力水平，范围 [0, 1]，0 最具创造性，1 完全遵循提示词
  aspect_ratio?: "1:1" | "16:9" | "9:16";  // 可选：视频宽高比
  camera_type?: "horizontal" | "vertical" | "zoom" | "tilt" | "pan" | "roll" | 
                "down_back" | "forward_up" | "right_turn_forward" | "left_turn_forward";  // 可选：相机控制
  camera_value?: number;         // 可选：相机参数，范围 [-10, 10]
}

// 验证参数的函数
function validateParams(params: KlingTextToVideoParams): { isValid: boolean; error?: string } {
  // 验证必需的 prompt
  if (!params.prompt || params.prompt.trim() === '') {
    return { isValid: false, error: "prompt 是必需的" };
  }

  // 验证 cfg 范围
  if (params.cfg !== undefined && (params.cfg < 0 || params.cfg > 1)) {
    return { isValid: false, error: "cfg 必须在 0 到 1 之间" };
  }

  // 验证 aspect_ratio
  if (params.aspect_ratio && !["1:1", "16:9", "9:16"].includes(params.aspect_ratio)) {
    return { isValid: false, error: "aspect_ratio 必须是 1:1, 16:9 或 9:16" };
  }

  // 验证 camera_value 范围
  if (params.camera_value !== undefined && (params.camera_value < -10 || params.camera_value > 10)) {
    return { isValid: false, error: "camera_value 必须在 -10 到 10 之间" };
  }

  return { isValid: true };
}

// 获取环境变量
const apiKey = process.env.API_302_KEY;
const baseUrl = process.env.API_302_BASE_URL;

if (!apiKey || !baseUrl) {
  throw new Error("Missing required environment variables for 302 API");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as KlingTextToVideoParams;
    
    // 验证参数
    const validation = validateParams(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // 调用 Kling AI 的 API
    const response = await fetch(`${baseUrl}/${MODEL_CONFIG.endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,  // 自动添加 Authorization header
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // 处理非 2xx 响应
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, error: errorData.message || "API 调用失败" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      model: {
        name: MODEL_CONFIG.name,
        version: MODEL_CONFIG.version,
        duration: MODEL_CONFIG.duration,
        isHQ: MODEL_CONFIG.isHQ
      },
      data: data
    });
  } catch (error) {
    console.error('Text to video generation error:', error);
    return NextResponse.json(
      { success: false, error: "视频生成请求处理失败" },
      { status: 500 }
    );
  }
} 