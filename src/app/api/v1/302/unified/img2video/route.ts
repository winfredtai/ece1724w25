import { NextRequest, NextResponse } from "next/server";

// 定义请求参数的类型
interface ImageToVideoParams {
  prompt?: string;                // 可选：视频提示词
  negative_prompt?: string;       // 可选：负面提示词
  cfg?: string;                   // 创造力水平
  aspect_ratio?: string;          // 视频宽高比
  model?: string;                 // 模型名称
  quality?: string;               // 视频质量
  video_length?: string;          // 视频时长
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.API_302_KEY;
    const baseUrl = process.env.API_302_BASE_URL;

    if (!apiKey || !baseUrl) {
      console.error('Missing required environment variables for 302 API');
      return NextResponse.json(
        { success: false, error: "API configuration missing" },
        { status: 500 }
      );
    }

    // 首先检查是否有文件
    const formData = await request.formData();
    const inputImage = formData.get('input_image') as File;
    
    // 从formData中获取其他参数
    const prompt = formData.get('prompt') as string;
    const negativePrompt = formData.get('negative_prompt') as string;
    const cfg = formData.get('cfg') as string;
    const aspectRatio = formData.get('aspect_ratio') as string;
    const model = formData.get('model') as string || 'kling'; // 默认使用kling模型
    const quality = formData.get('quality') as string || 'normal'; // 默认普通质量
    const videoLength = formData.get('video_length') as string || '5s'; // 默认5秒

    // 验证必要的输入
    if (!inputImage) {
      return NextResponse.json(
        { success: false, error: "input_image is required" },
        { status: 400 }
      );
    }

    // 验证文件大小 (10MB 限制)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (inputImage.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "Image size must not exceed 10MB" },
        { status: 400 }
      );
    }

    // 确定调用哪个API端点
    let apiEndpoint = `${baseUrl}/klingai/m2v_16_img2video_5s`;
    
    // 根据模型和时长选择不同的端点
    // 暂时只支持kling模型的5秒版本，后续可扩展

    // 创建FormData用于API请求
    const apiFormData = new FormData();
    apiFormData.append('input_image', inputImage);
    
    if (prompt) apiFormData.append('prompt', prompt);
    if (negativePrompt) apiFormData.append('negative_prompt', negativePrompt);
    
    // 处理cfg值
    if (cfg) {
      const cfgValue = parseFloat(cfg);
      if (!isNaN(cfgValue) && cfgValue >= 0 && cfgValue <= 1) {
        apiFormData.append('cfg', cfg);
      }
    }
    
    // 处理aspect_ratio值
    if (aspectRatio) {
      const validRatios = ['1:1', '16:9', '9:16'];
      if (validRatios.includes(aspectRatio)) {
        apiFormData.append('aspect_ratio', aspectRatio);
      }
    }

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    try {
      // 调用Klingai API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: apiFormData,
        signal: controller.signal,
      });
      
      // 清除超时
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response from Klingai API:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        return NextResponse.json(
          { success: false, error: errorData.message || `API call failed: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log('Klingai API response:', data);
      
      // 从响应中提取任务ID
      let taskId;
      if (data.data && data.data.task && data.data.task.id) {
        taskId = data.data.task.id;
      } else {
        taskId = data.id || data.task_id || data.taskId || 
                (data.task && (data.task.id || data.task.task_id || data.task.taskId));
      }
      
      if (!taskId) {
        console.error('No task ID found in response:', data);
        return NextResponse.json(
          { success: false, error: "Failed to extract task ID from API response" },
          { status: 500 }
        );
      }
      
      console.log('Extracted task ID:', taskId);
      
      // 解析视频长度，移除's'后缀，仅保留数字
      const duration = parseInt(videoLength.replace('s', ''));
      
      return NextResponse.json({
        success: true,
        data: {
          task: {
            id: taskId,
          },
          model: {
            name: `Image to Video (${videoLength})`,
            version: "1.0",
            duration: duration,
            quality: quality === 'high' ? 'high' : 'normal'
          }
        }
      });
    } catch (error) {
      console.error('Unified img2video error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to process video generation request", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unified img2video error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to process video generation request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 