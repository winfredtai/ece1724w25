import { NextRequest, NextResponse } from "next/server";

// 定义请求参数的类型
interface TextToVideoParams {
  prompt: string;                 // 必需：视频提示词
  cfg: string;                    // 创造力水平
  aspect_ratio: string;           // 视频宽高比 
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

    const body = await request.json() as TextToVideoParams;
    console.log('Unified text2video request:', body);
    
    // Convert cfg from string to number if needed
    const cfg = parseFloat(body.cfg);
    
    // Prepare the request to the klingai endpoint
    const klingaiParams = {
      prompt: body.prompt,
      cfg: isNaN(cfg) ? 0.5 : cfg, // Default to 0.5 if parsing fails
      aspect_ratio: body.aspect_ratio
    };

    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    try {
      // Call the Klingai endpoint
      const response = await fetch(`${baseUrl}/klingai/m2v_16_txt2video_5s`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(klingaiParams),
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
      
      // Extract task ID from the response (handle different possible formats)
      const taskId = data.id || data.task_id || data.taskId || 
                    (data.task && (data.task.id || data.task.task_id || data.task.taskId)) ||
                    (data.data && data.data.task && data.data.task.id);
      
      if (!taskId) {
        console.error('No task ID found in response:', data);
        return NextResponse.json(
          { success: false, error: "Failed to extract task ID from API response" },
          { status: 500 }
        );
      }
      
      console.log('Extracted task ID:', taskId);
      
      return NextResponse.json({
        success: true,
        data: {
          task: {
            id: taskId,
          },
          model: {
            name: "Text to Video (5s)",
            version: "1.0",
            duration: 5,
          }
        }
      });
    } catch (error) {
      console.error('Unified text2video error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to process video generation request", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unified text2video error:', error);
    return NextResponse.json(
      { success: false, error: "Failed to process video generation request", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 