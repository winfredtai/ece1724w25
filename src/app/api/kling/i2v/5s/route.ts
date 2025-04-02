import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_KEY = process.env.API_302_KEY;
const API_BASE_URL = process.env.API_302_BASE_URL + '/klingai/m2v_16_img2video_5s';
const CREDITS_REQUIRED = 2; // 图生视频标准质量5秒所需积分

export async function POST(request: Request) {
  const log = (message: string, data?: any) => {
    console.log(`[I2V-5S] ${message}`, data ? JSON.stringify(data) : '');
  };

  try {
    const supabase = await createClient();

    // 1. 验证用户身份
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: '未登录或登录已过期' }, { status: 401 });
    }
    log('User authenticated', user.id);

    // 2. 检查用户积分
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits_balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (creditsError) {
      log('Error fetching credits', creditsError);
      return NextResponse.json({ error: '获取用户积分失败' }, { status: 500 });
    }

    if (!credits || credits.credits_balance < CREDITS_REQUIRED) {
      return NextResponse.json({ error: '积分不足' }, { status: 400 });
    }
    log('User credits verified', credits.credits_balance);

    // 3. 解析请求数据
    const formData = await request.formData();
    const inputImage = formData.get('input_image') as File;
    const prompt = formData.get('prompt') as string;
    const negativePrompt = formData.get('negative_prompt') as string;
    const cfg = formData.get('cfg') as string;

    if (!inputImage || !prompt) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 4. 创建任务记录
    const { data: taskDef, error: taskDefError } = await supabase
      .from('video_generation_task_definitions')
      .insert({
        user_id: user.id,
        task_type: 'i2v',
        model: 'kling',
        high_quality: false,
        prompt: prompt,
        negative_prompt: negativePrompt || '',
        cfg: cfg ? parseFloat(cfg) : 0.3,
        credits: CREDITS_REQUIRED,
        additional_params: {
          duration: '5s'
        }
      })
      .select()
      .single();

    if (taskDefError || !taskDef) {
      log('Error creating task definition', taskDefError);
      return NextResponse.json({ error: '创建任务记录失败' }, { status: 500 });
    }
    log('Task definition created', taskDef.id);

    // 5. 准备调用外部 API
    const apiFormData = new FormData();
    apiFormData.append('input_image', inputImage);
    apiFormData.append('prompt', prompt);
    if (negativePrompt) apiFormData.append('negative_prompt', negativePrompt);
    apiFormData.append('cfg', cfg || '0.3');

    // 打印完整的 API URL
    log('Calling API URL', API_BASE_URL);
    log('API Key', API_KEY ? 'Present' : 'Missing');

    // 6. 调用 302.ai API
    const apiResponse = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      },
      body: apiFormData
    });

    if (!apiResponse.ok) {
      const apiError = await apiResponse.json();
      log('API Error', apiError);
      throw new Error(apiError.message || '调用视频生成服务失败');
    }

    const apiResult = await apiResponse.json();
    log('API Response', apiResult);

    // 从返回数据中提取 task id
    const externalTaskId = apiResult.data?.task?.id;
    if (!externalTaskId) {
      log('No task ID in response', apiResult);
      throw new Error('未能获取任务ID');
    }
    log('Extracted task ID', externalTaskId);

    // 7. 创建任务状态记录
    const { data: taskStatus, error: taskStatusError } = await supabase
      .from('video_generation_task_statuses')
      .insert({
        task_id: taskDef.id,
        external_task_id: externalTaskId,
        status: 'pending'
      })
      .select()
      .single();

    if (taskStatusError || !taskStatus) {
      log('Error creating task status', taskStatusError);
      return NextResponse.json({ error: '创建任务状态记录失败' }, { status: 500 });
    }
    log('Task status created', taskStatus.id);

    // 8. 返回成功响应
    return NextResponse.json({
      message: '任务创建成功',
      taskId: taskDef.id,
      status: 'pending'
    });

  } catch (error) {
    log('Unexpected error', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误' },
      { status: 500 }
    );
  }
} 