import { NextRequest, NextResponse } from "next/server";

// 获取环境变量
const apiKey = process.env.API_302_KEY;
const baseUrl = process.env.API_302_BASE_URL;

if (!apiKey || !baseUrl) {
  throw new Error("Missing required environment variables for 302 API");
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
    
    if (!taskId || taskId === "unknown") {
      console.log("Invalid taskId:", taskId);
      return NextResponse.json(
        { status: -1, error: "Invalid task ID" },
        { status: 400 }
      );
    }
    
    console.log(`Fetching result for task: ${taskId}`);
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 将超时增加到30秒
    
    try {
      // 调用 Kling AI 的 API 获取任务状态
      const response = await fetch(`${baseUrl}/klingai/task/${taskId}/fetch`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      // 清除超时
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response from API:", {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        return NextResponse.json(
          { 
            status: -1, 
            error: errorData.message || `Failed to fetch task result: ${response.status} ${response.statusText}`
          },
          { status: 200 }
        );
      }

      const data = await response.json();
      console.log('Task result data:', data);
      
      // 处理返回结果
      let status = 0; // 默认为处理中
      let videoUrl = "";
      let coverUrl = "";
      
      // 直接按照API返回的确切格式提取状态码
      // 状态码在 data.data.task.status 或 data.data.status
      const taskStatus = data.data?.data?.task?.status || 
                        data.data?.task?.status || 
                        data.data?.status || 
                        0;
      
      // 状态码映射：5=排队中，10=生成中，99=生成完毕，其他情况=处理中
      if (taskStatus === 99) {
        status = 1; // 完成状态
        
        // 打印完整响应以便调试
        console.log('Task completed, full response structure:', JSON.stringify(data));
        
        // 直接按照确切的API格式提取视频和封面URL
        try {
          // 检查不同可能的位置来找到视频URL
          if (data.data?.data?.works?.[0]?.resource?.resource) {
            videoUrl = data.data.data.works[0].resource.resource;
            console.log('Found video URL at data.data.data.works[0].resource.resource:', videoUrl);
          } else if (data.data?.works?.[0]?.resource?.resource) {
            videoUrl = data.data.works[0].resource.resource;
            console.log('Found video URL at data.data.works[0].resource.resource:', videoUrl);
          } else if (data.data?.data?.works?.[0]?.resource) {
            videoUrl = data.data.data.works[0].resource;
            console.log('Found video URL at data.data.data.works[0].resource:', videoUrl);
          } else if (data.data?.works?.[0]?.resource) {
            videoUrl = data.data.works[0].resource;
            console.log('Found video URL at data.data.works[0].resource:', videoUrl);
          } else {
            console.error('Could not find video URL in the response');
          }
          
          // 同样检查不同位置找到封面URL
          if (data.data?.data?.works?.[0]?.cover?.resource) {
            coverUrl = data.data.data.works[0].cover.resource;
            console.log('Found cover URL at data.data.data.works[0].cover.resource:', coverUrl);
          } else if (data.data?.works?.[0]?.cover?.resource) {
            coverUrl = data.data.works[0].cover.resource;
            console.log('Found cover URL at data.data.works[0].cover.resource:', coverUrl);
          } else if (data.data?.data?.works?.[0]?.cover) {
            coverUrl = data.data.data.works[0].cover;
            console.log('Found cover URL at data.data.data.works[0].cover:', coverUrl);
          } else if (data.data?.works?.[0]?.cover) {
            coverUrl = data.data.works[0].cover;
            console.log('Found cover URL at data.data.works[0].cover:', coverUrl);
          } else {
            console.error('Could not find cover URL in the response');
          }
        } catch (e) {
          console.error("Error extracting URLs:", e);
        }
      } else if (taskStatus === 5) {
        status = 5; // 排队中
      } else if (taskStatus === 10) {
        status = 10; // 生成中
      } else if (taskStatus === -1 || taskStatus === "failed" || taskStatus === "error") {
        status = -1; // 失败
      }
      
      // 返回标准格式的响应
      return NextResponse.json({
        status,
        videoUrl,
        coverUrl,
        message: data.data?.message || data.message || "",
        rawStatus: taskStatus,
        timestamp: Date.now() // 添加时间戳确保每次请求响应不被缓存
      });
    } catch (error) {
      console.error('Error fetching task result:', error);
      return NextResponse.json(
        { 
          status: -1,
          error: "Failed to retrieve task result",
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error fetching task result:', error);
    return NextResponse.json(
      { 
        status: -1,
        error: "Failed to retrieve task result",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 200 }
    );
  }
} 