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

const API_BASE_URL = "http://localhost:5001/api";

// 视频生成 API
export const videoApi = {
  // 生成视频
  generateVideo: async (params: VideoGenerationParams): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE_URL}/302/unified/text2video`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data.data.task.id;
    } catch (error) {
      console.error("视频生成错误:", error);
      throw error;
    }
  },

  // 获取视频状态
  getVideoStatus: async (taskId: string): Promise<VideoStatus> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/302/tasks/${taskId}/result`,
      );
      const data = await response.json();

      return {
        status: data.status,
        videoUrl: data.videoUrl || "",
        coverUrl: data.coverUrl || "",
      };
    } catch (error) {
      console.error("获取视频状态错误:", error);
      throw error;
    }
  },

  // 上传图片生成视频
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
};

export default videoApi;
