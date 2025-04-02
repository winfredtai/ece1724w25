interface VideoGenerationParams {
  prompt: string;
  negative_prompt: string;
  aspect_ratio: "1:1" | "16:9" | "9:16";
  quality: "normal" | "hq";
  duration: "5s" | "10s";
  model: "kling";
}

interface VideoGenerationResponse {
  taskId: string;
  status: string;
  // 可以根据实际返回数据扩展这个接口
}

/**
 * 根据参数构建API路径
 */
const getApiPath = (params: VideoGenerationParams) => {
  const { model, quality, duration } = params;
  
  // 目前只支持 kling 模型
  if (model === "kling") {
    // 根据质量和时长构建路径
    const path = `/api/kling/${quality === "hq" ? "hq/" : ""}${duration}`;
    return path;
  }
  
  throw new Error("Unsupported model");
};

/**
 * 统一的视频生成请求函数
 */
export const generateVideo = async (
  params: VideoGenerationParams
): Promise<VideoGenerationResponse> => {
  try {
    const apiPath = getApiPath(params);
    
    const response = await fetch(apiPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: params.prompt,
        negative_prompt: params.negative_prompt,
        aspect_ratio: params.aspect_ratio,
        cfg: 0.3, // 默认值
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Video generation error:", error);
    throw error;
  }
}; 