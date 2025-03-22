interface Model {
  name: string;
  version: string;
  duration: number;
  isHQ: boolean;
  endpoint: string;
  type: 'text2video' | 'image2video';  // 模型类型：文生视频或图生视频
}

interface Provider {
  name: string;
  models: { [key: string]: Model };
}

// API 供应商配置
export const PROVIDERS: { [key: string]: Provider } = {
  '302ai': {
    name: '302.AI',
    models: {
      // 文生视频模型
      'kling': {
        name: 'Text to Video 1.0 Rapid-5s',
        version: '1.0',
        duration: 5,
        isHQ: false,
        endpoint: 'klingai/m2v_txt2video',
        type: 'text2video'
      },
      'kling-1.6': {
        name: 'Text to Video 1.6 Standard-5s',
        version: '1.6',
        duration: 5,
        isHQ: false,
        endpoint: 'klingai/m2v_16_txt2video_5s',
        type: 'text2video'
      },
      'kling-1.6-10s': {
        name: 'Text to Video 1.6 Standard-10s',
        version: '1.6',
        duration: 10,
        isHQ: false,
        endpoint: 'klingai/m2v_16_txt2video_10s',
        type: 'text2video'
      },
      'kling-1.6-hq': {
        name: 'Text to Video 1.6 HQ-5s',
        version: '1.6',
        duration: 5,
        isHQ: true,
        endpoint: 'klingai/m2v_16_txt2video_hq_5s',
        type: 'text2video'
      },
      'kling-1.6-10s-hq': {
        name: 'Text to Video 1.6 HQ-10s',
        version: '1.6',
        duration: 10,
        isHQ: true,
        endpoint: 'klingai/m2v_16_txt2video_hq_10s',
        type: 'text2video'
      },
      
      // 图生视频模型
      'i2v-1.6': {
        name: 'Image to Video 1.6 Standard-5s',
        version: '1.6',
        duration: 5,
        isHQ: false,
        endpoint: 'klingai/m2v_16_img2video_5s',
        type: 'image2video'
      },
      'i2v-1.6-10s': {
        name: 'Image to Video 1.6 Standard-10s',
        version: '1.6',
        duration: 10,
        isHQ: false,
        endpoint: 'klingai/m2v_16_img2video_10s',
        type: 'image2video'
      },
      'i2v-1.6-hq': {
        name: 'Image to Video 1.6 HQ-5s',
        version: '1.6',
        duration: 5,
        isHQ: true,
        endpoint: 'klingai/m2v_16_img2video_hq_5s',
        type: 'image2video'
      },
      'i2v-1.6-10s-hq': {
        name: 'Image to Video 1.6 HQ-10s',
        version: '1.6',
        duration: 10,
        isHQ: true,
        endpoint: 'klingai/m2v_16_img2video_hq_10s',
        type: 'image2video'
      }
    }
  }
  // 可以添加更多供应商...
};

// 根据模型名获取供应商信息
export function getProviderByModel(modelName: string): { provider: string; model: Model } | null {
  for (const [providerKey, provider] of Object.entries(PROVIDERS)) {
    if (provider.models[modelName]) {
      return {
        provider: providerKey,
        model: provider.models[modelName]
      };
    }
  }
  return null;
} 