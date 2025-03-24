import { NextRequest, NextResponse } from "next/server";
import { getProviderByModel } from "@/lib/providers";

// 文生视频API参数类型
interface Text2VideoParams {
  prompt: string;
  negative_prompt?: string;
  cfg?: number;
  aspect_ratio?: string;
}

// 图生视频API参数类型 - 标记为未使用但作为参考保留
/* 
interface Image2VideoParams {
  input_image?: File;   // 图片文件
  image?: string;       // base64编码的图片(旧格式)
  prompt?: string;      // 图生视频也可以有提示文本
  negative_prompt?: string;
  motion_scale?: number;
  cfg?: number;
  aspect_ratio?: string;
}
*/

// 统一的请求参数类型
interface VideoGenerationRequest {
  // 通用参数
  model?: string;
  quality?: 'normal' | 'high';
  video_length?: string;
  length?: number;
  aspect_ratio?: string;
  cfg?: string | number;
  
  // 文生视频特有参数
  prompt?: string;
  negative_prompt?: string;
  
  // 图生视频特有参数
  input_image?: File;   // 图片文件
  image?: string;       // base64编码的图片
  motion_scale?: string | number;
}

// 为formData处理创建类型
interface RequestBodyKey {
  [key: string]: unknown;
}

// 默认参数配置
const DEFAULT_PARAMS = {
  // 通用默认参数
  cfg: 0.5,
  aspect_ratio: '1:1',
  model: 'kling',
  quality: 'normal' as const,
  video_length: '5s',
  length: 5,
  
  // 文生视频默认参数
  negative_prompt: '',
  
  // 图生视频默认参数
  motion_scale: 0.5
};

export async function POST(request: NextRequest) {
  try {
    const API_KEY = process.env.API_302_KEY;
    const BASE_URL = process.env.API_302_BASE_URL || 'https://api.302.ai';

    if (!API_KEY) {
      console.error('Missing API key');
      return NextResponse.json(
        { success: false, error: "API 密钥缺失" },
        { status: 500 }
      );
    }

    // 检查内容类型
    const contentType = request.headers.get('content-type') || '';
    let requestBody: VideoGenerationRequest;
    let formData: FormData | null = null;

    // 处理不同的请求格式
    if (contentType.includes('multipart/form-data')) {
      // 表单数据请求
      formData = await request.formData();
      requestBody = {} as VideoGenerationRequest;
      
      // 提取表单中的参数
      for (const key of formData.keys()) {
        const value = formData.get(key);
        if (value instanceof File) {
          requestBody.input_image = value;
        } else if (key === 'cfg' && typeof value === 'string') {
          requestBody.cfg = parseFloat(value);
        } else if (key === 'length' && typeof value === 'string') {
          requestBody.length = parseInt(value, 10);
        } else if (key === 'quality' && typeof value === 'string') {
          // 确保 quality 参数被正确解析
          requestBody.quality = value === 'high' ? 'high' : 'normal';
          console.log('表单中设置了 quality 参数:', value, '->', requestBody.quality);
        } else if (typeof value === 'string') {
          (requestBody as RequestBodyKey)[key] = value;
        }
      }
    } else {
      // JSON 请求
      requestBody = await request.json() as VideoGenerationRequest;
    }

    // 合并默认值和请求参数
    const body = {
      ...DEFAULT_PARAMS,
      ...requestBody
    };

    console.log('请求参数:', {
      hasInputImage: !!body.input_image,
      hasImageBase64: !!body.image,
      hasPrompt: !!body.prompt,
      quality: body.quality,
      length: body.length,
      formDataKeys: formData ? Array.from(formData.keys()) : []
    });

    // 确定请求类型（文生视频 or 图生视频）
    let modelType: 'text2video' | 'image2video';
    if (body.input_image || body.image) {
      modelType = 'image2video';
      // 初始模型设置将在下面统一处理
    } else if (body.prompt) {
      modelType = 'text2video';
      // 验证必需的 prompt
      if (body.prompt.trim() === '') {
        return NextResponse.json(
          { success: false, error: "prompt 是必需的参数" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "必须提供 prompt 或图片" },
        { status: 400 }
      );
    }

    // 根据模型和时长选择正确的模型ID
    let modelId = body.model;
    
    console.log('初始模型选择:', {
      modelType,
      originalModel: body.model,
      quality: body.quality,
      length: body.length
    });
    
    // 处理 kling-1.6 模型的时长选择
    if (modelType === 'text2video' && body.model === 'kling-1.6') {
      if (body.length == 10) {  // 使用宽松相等
        modelId = 'kling-1.6-10s';
      } else {
        // 默认使用5秒版本
        modelId = 'kling-1.6';
      }
      
      // 处理 quality 参数
      if (body.quality === 'high') {
        if (modelId === 'kling-1.6') {
          modelId = 'kling-1.6-hq';
          console.log('使用高质量5秒模型:', modelId);
        } else if (modelId === 'kling-1.6-10s') {
          modelId = 'kling-1.6-10s-hq';
          console.log('使用高质量10秒模型:', modelId);
        }
      }
    } else if (body.quality === 'high' && modelType === 'text2video') {
      console.log('注意：当前只支持kling-1.6的高质量模型，其他模型仍使用标准质量');
    }
    
    // 处理图生视频模型
    if (modelType === 'image2video') {
      console.log('图生视频模型选择开始:', {
        initialModel: modelId,
        quality: body.quality,
        length: body.length,
        bodyKeys: Object.keys(body)
      });
      
      // 默认设置图生视频模型
      modelId = 'i2v-1.6'; // 默认5秒模型
      
      // 根据视频长度选择模型
      if (body.length == 10) {  // 使用宽松相等以同时处理数字和字符串
        modelId = 'i2v-1.6-10s';
        console.log('使用10秒图生视频模型:', modelId);
      } else {
        console.log('使用5秒图生视频模型:', modelId);
      }
      
      // 处理高质量图生视频请求
      if (body.quality === 'high') {
        const originalModel = modelId;
        if (modelId === 'i2v-1.6') {
          modelId = 'i2v-1.6-hq';
          console.log(`切换到高质量5秒图生视频模型: ${originalModel} -> ${modelId}`);
        } else if (modelId === 'i2v-1.6-10s') {
          modelId = 'i2v-1.6-10s-hq';
          console.log(`切换到高质量10秒图生视频模型: ${originalModel} -> ${modelId}`);
        } else {
          console.log('当前模型不支持高质量版本，使用原始模型:', modelId);
        }
      } else {
        console.log('使用标准质量模型 (quality != high):', body.quality);
      }
    }
    
    console.log('最终模型选择:', {
      modelId,
      modelType,
      quality: body.quality
    });

    // 获取供应商信息
    const providerInfo = getProviderByModel(modelId);
    if (!providerInfo) {
      console.error(`不支持的模型: ${modelId}`);
      return NextResponse.json({ 
        success: false, 
        error: `不支持的模型: ${modelId}` 
      }, { status: 400 });
    }
    
    console.log('请求供应商信息:', {
      provider: providerInfo.provider,
      modelId,
      modelName: providerInfo.model.name,
      endpoint: providerInfo.model.endpoint,
      isHQ: providerInfo.model.isHQ
    });

    // API URL
    const url = `${BASE_URL}/${providerInfo.model.endpoint}`;
    
    // 添加调试信息，输出请求的细节
    console.log('发送API请求:', {
      url,
      modelId,
      modelName: providerInfo.model.name,
      isHQ: providerInfo.model.isHQ,
      hasImage: !!body.input_image || !!body.image,
      quality: body.quality
    });

    // 调用 302 API
    let response: Response;
    
    if (modelType === 'text2video') {
      // 文生视频使用 JSON 请求
      const apiParams: Text2VideoParams = {
        prompt: body.prompt || ''
      };

      // 负面提示词
      if (body.negative_prompt && body.negative_prompt.trim() !== '') {
        apiParams.negative_prompt = body.negative_prompt;
      }

      // 通用参数：cfg
      if (body.cfg !== undefined) {
        const cfgValue = typeof body.cfg === 'string' ? parseFloat(body.cfg) : body.cfg;
        if (!isNaN(cfgValue) && cfgValue >= 0 && cfgValue <= 1) {
          apiParams.cfg = cfgValue;
        }
      }

      // 通用参数：宽高比
      if (body.aspect_ratio && ['1:1', '16:9', '9:16'].includes(body.aspect_ratio)) {
        apiParams.aspect_ratio = body.aspect_ratio;
      }
      
      console.log('发送文生视频请求:', {
        url: `${BASE_URL}/${providerInfo.model.endpoint}`,
        modelId,
        isHQ: providerInfo.model.isHQ
      });

      response = await fetch(`${BASE_URL}/${providerInfo.model.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(apiParams)
      });
    } else {
      // 图生视频使用表单数据请求
      const newFormData = new FormData();
      
      // 添加图片
      if (formData && body.input_image) {
        newFormData.append('input_image', body.input_image);
      } else if (body.image) {
        // 如果是 base64 格式，需要转换为文件
        try {
          const binaryString = atob(body.image.split(',')[1] || body.image);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'image/jpeg' });
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
          newFormData.append('input_image', file);
        } catch (error) {
          console.error('转换 base64 图片失败:', error);
          return NextResponse.json(
            { success: false, error: "图片格式错误" },
            { status: 400 }
          );
        }
      }

      // 添加提示文本（如果有）
      if (body.prompt) {
        newFormData.append('prompt', body.prompt);
      }
      
      // 添加负面提示词（如果有）
      if (body.negative_prompt) {
        newFormData.append('negative_prompt', body.negative_prompt);
      }
      
      // 添加 cfg 参数
      newFormData.append('cfg', body.cfg.toString());
      
      // 添加宽高比
      newFormData.append('aspect_ratio', body.aspect_ratio);
      
      console.log('发送图生视频请求:', {
        url: `${BASE_URL}/${providerInfo.model.endpoint}`,
        modelId,
        modelName: providerInfo.model.name,
        isHQ: providerInfo.model.isHQ,
        endpoint: providerInfo.model.endpoint
      });

      response = await fetch(`${BASE_URL}/${providerInfo.model.endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        body: newFormData
      });
    }

    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

    // 获取原始响应文本
    const responseText = await response.text();
    console.log('API Raw Response:', responseText);

    // 如果响应为空
    if (!responseText.trim()) {
      console.error('Empty response from API');
      return NextResponse.json({
        success: false,
        error: "API 返回空响应",
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: 500 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      const parseError = error as Error;
      console.error('Failed to parse API response:', parseError);
      return NextResponse.json({
        success: false,
        error: "API 响应格式错误",
        details: {
          responseText,
          parseError: parseError.message
        }
      }, { status: 500 });
    }
    
    if (!response.ok) {
      console.error('API error response:', data);
      return NextResponse.json(
        { 
          success: false, 
          error: data.error?.message || "Request failed",
          details: data
        },
        { status: response.status }
      );
    }

    // 添加供应商和模型信息到响应中
    return NextResponse.json({
      success: true,
      provider: providerInfo.provider,
      type: modelType,
      model: {
        name: providerInfo.model.name,
        version: providerInfo.model.version,
        duration: providerInfo.model.duration,
        isHQ: providerInfo.model.isHQ
      },
      data
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: "视频生成请求失败",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 