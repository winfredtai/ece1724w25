// 定义类型
export interface VideoGenerationParams {
  prompt: string;
  cfg: string;
  aspect_ratio: string;
}

export interface VideoStatus {
  status: number;
  videoUrl: string;
  coverUrl: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const API_BASE_URL = "/api/v1";

// 视频生成 API
export const videoApi = {
  // 生成视频
  generateVideo: async (params: VideoGenerationParams): Promise<string> => {
    try {
      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      try {
        const response = await fetch(`${API_BASE_URL}/302/unified/text2video`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
          signal: controller.signal,
        });
        
        // 清除超时
        clearTimeout(timeoutId);

        const data = await response.json();
        
        // Check if the response was successful
        if (!data.success) {
          console.error("Video generation failed:", data.error, data.details || "");
          throw new Error(data.error || "Video generation failed");
        }
        
        if (!data.data || !data.data.task || !data.data.task.id) {
          console.error("Invalid response format:", data);
          throw new Error("Invalid response format: task ID not found");
        }
        
        return data.data.task.id;
      } catch (fetchError: unknown) {
        // 清除超时
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            console.error("请求超时：无法连接到视频生成服务，请检查网络连接");
            throw new Error("连接超时：无法连接到视频生成服务，请检查网络连接并重试");
          } else {
            console.error("网络错误:", fetchError);
            throw new Error(`网络错误: ${fetchError.message}`);
          }
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error("视频生成错误:", error);
      throw error;
    }
  },

  // 获取视频状态
  getVideoStatus: async (taskId: string): Promise<VideoStatus> => {
    try {
      if (!taskId) {
        console.error("无效的任务ID:", taskId);
        return { status: -1, videoUrl: "", coverUrl: "" };
      }
      
      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/302/tasks/${taskId}/result`,
          {
            signal: controller.signal, // 使用AbortController
          }
        );
        
        // 清除超时
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error("视频状态API错误:", response.status, response.statusText);
          return { status: -1, videoUrl: "", coverUrl: "" };
        }
        
        const data = await response.json();
        
        // 仅当找到视频URL或状态为完成时记录日志
        if (data.videoUrl || (data.status && data.status === 1)) {
          console.log("获取到视频状态:", { 
            status: data.status, 
            hasVideoUrl: !!data.videoUrl,
            hasCoverUrl: !!data.coverUrl
          });
        }
        
        // 检查是否有videoUrl和coverUrl
        if (data.videoUrl) {
          console.log("在响应中找到视频URL");
        }
        
        // 构建返回对象
        const result = {
          status: data.status || 0,
          videoUrl: data.videoUrl || "",
          coverUrl: data.coverUrl || "",
        };
        
        return result;
      } catch (fetchError: unknown) {
        // 处理fetch错误，包括请求中断
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          console.warn("Video status request aborted due to timeout");
        } else {
          console.error("Fetch error in getVideoStatus:", fetchError);
        }
        
        return { status: 0, videoUrl: "", coverUrl: "" };
      }
    } catch (error) {
      console.error("获取视频状态错误:", error);
      return { status: -1, videoUrl: "", coverUrl: "" };
    }
  },

  // 上传图片生成视频 (Runway API - 旧版本)
  async generateImageToVideo(formData: FormData): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/302/runway/submit`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate video");
      }

      const data = await response.json();
      return data.data.task.id;
    } catch (error) {
      console.error("Error in generateImageToVideo:", error);
      throw error;
    }
  },
  
  // 图片转视频 (使用统一接口)
  async imageToVideo(formData: FormData): Promise<string> {
    try {
      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
      
      try {
        const response = await fetch(`${API_BASE_URL}/302/unified/img2video`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        
        // 清除超时
        clearTimeout(timeoutId);

        const data = await response.json();
        
        // 检查响应是否成功
        if (!data.success) {
          console.error("图片转视频失败:", data.error, data.details || "");
          throw new Error(data.error || "图片转视频失败");
        }
        
        if (!data.data || !data.data.task || !data.data.task.id) {
          console.error("无效的响应格式:", data);
          throw new Error("无效的响应格式: 未找到任务ID");
        }
        
        return data.data.task.id;
      } catch (fetchError: unknown) {
        // 清除超时
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error) {
          if (fetchError.name === "AbortError") {
            console.error("请求超时：无法连接到视频生成服务，请检查网络连接");
            throw new Error("连接超时：无法连接到视频生成服务，请检查网络连接并重试");
          } else {
            console.error("网络错误:", fetchError);
            throw new Error(`网络错误: ${fetchError.message}`);
          }
        }
        
        throw fetchError;
      }
    } catch (error) {
      console.error("图片转视频错误:", error);
      throw error;
    }
  },
};

export default videoApi;
