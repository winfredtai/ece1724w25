CREATE OR REPLACE FUNCTION public.update_i2v_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task RECORD;
  api_response json;
  new_status text;
  my_result_url text;
  my_thumbnail_url text;
  my_error_message text;
  success_count int := 0;
  fail_count int := 0;
  api_base_url text := 'https://api.302.ai';
  api_key text := current_setting('app.api_302_key', true);
  start_time timestamptz;
  batch_size int := 10;
  processed_count int := 0;
  debug_info json[];
  use_fallback boolean := false;
  
  -- HTTP 请求相关变量
  task_url text;
  http_resp record;
BEGIN
  start_time := clock_timestamp();
  
  -- 记录开始状态
  debug_info := array_append(debug_info, json_build_object(
    'api_url', api_base_url,
    'start_time', start_time
  ));
  
  -- 查询处理中和等待中的图生视频任务
  FOR task IN 
    SELECT s.*, d.task_type 
    FROM public.video_generation_task_statuses s
    JOIN public.video_generation_task_definitions d ON s.task_id = d.id 
    WHERE s.status IN ('processing', 'pending', 'queued')
    AND d.task_type = 'i2v'  -- 只处理图生视频任务
    ORDER BY s.updated_at ASC
    LIMIT batch_size
  LOOP
    processed_count := processed_count + 1;
    use_fallback := false;
    
    BEGIN
      -- 构建 302.ai 的任务查询 URL
      task_url := api_base_url || '/klingai/task/' || task.external_task_id || '/fetch';
      
      debug_info := array_append(debug_info, json_build_object(
        'task_id', task.id,
        'external_task_id', task.external_task_id,
        'api_url', task_url
      ));
      
      -- 发送 GET 请求到 302.ai
      SELECT * FROM http_get(
        task_url,
        ARRAY[
          ('Authorization', 'Bearer ' || api_key)::http_header
        ]
      ) INTO http_resp;
      
      -- 检查响应
      IF http_resp.status = 200 AND http_resp.content IS NOT NULL THEN
        api_response := http_resp.content::json;
        
        -- 从响应中提取状态和 URL
        DECLARE
          api_status INTEGER;
          works json;
        BEGIN
          api_status := (api_response->'data'->>'status')::INTEGER;
          works := api_response->'data'->'works'->0;
          
          -- 根据状态码设置任务状态
          CASE api_status
            WHEN 99 THEN  -- 完成状态
              new_status := 'completed';
              -- 从 works 数组的第一个元素中获取 URL
              IF works IS NOT NULL THEN
                my_result_url := works->'resource'->>'resource';
                my_thumbnail_url := works->'cover'->>'resource';
              END IF;
            WHEN -1 THEN  -- 失败状态
              new_status := 'failed';
              my_error_message := api_response->'data'->>'message';
            WHEN 5 THEN  -- 排队中
              new_status := 'queued';
            WHEN 10 THEN  -- 处理中
              new_status := 'processing';
            ELSE
              -- 其他状态保持不变
              new_status := task.status;
          END CASE;
          
          debug_info := array_append(debug_info, json_build_object(
            'api_status', api_status,
            'new_status', new_status,
            'video_url', my_result_url,
            'cover_url', my_thumbnail_url
          ));
        END;
      ELSE
        use_fallback := true;
        debug_info := array_append(debug_info, json_build_object(
          'api_error', json_build_object(
            'status', http_resp.status,
            'content', http_resp.content
          )
        ));
      END IF;
      
      -- 如果 API 调用失败，使用后备逻辑
      IF use_fallback THEN
        -- 基于时间的启发式规则
        DECLARE
          hours_since_update NUMERIC := EXTRACT(EPOCH FROM (NOW() - task.updated_at)) / 3600;
        BEGIN
          IF task.status = 'processing' AND hours_since_update > 24 THEN
            new_status := 'failed';
            my_error_message := '任务处理超过24小时未完成，可能失败';
          ELSIF task.status = 'queued' AND hours_since_update > 6 THEN
            new_status := 'processing';
          END IF;
        END;
      END IF;
      
      -- 更新数据库
      IF new_status IS NOT NULL AND (new_status <> task.status OR my_result_url IS NOT NULL) THEN
        UPDATE public.video_generation_task_statuses
        SET 
          status = new_status,
          result_url = COALESCE(my_result_url, result_url),
          thumbnail_url = COALESCE(my_thumbnail_url, thumbnail_url),
          error_message = COALESCE(my_error_message, error_message),
          updated_at = NOW()
        WHERE id = task.id;
        
        success_count := success_count + 1;
      END IF;
      
      -- 重置变量
      new_status := NULL;
      my_result_url := NULL;
      my_thumbnail_url := NULL;
      my_error_message := NULL;
      
    EXCEPTION WHEN OTHERS THEN
      fail_count := fail_count + 1;
      debug_info := array_append(debug_info, json_build_object(
        'error', SQLERRM,
        'task_id', task.id
      ));
    END;
    
    -- 检查执行时间
    IF EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) > 25 THEN
      debug_info := array_append(debug_info, json_build_object(
        'early_exit', 'time_limit_reached'
      ));
      EXIT;
    END IF;
    
    -- 添加延迟
    PERFORM pg_sleep(0.5);
  END LOOP;
  
  -- 返回执行结果
  RETURN json_build_object(
    'success', true,
    'processed', processed_count,
    'updated', success_count,
    'failed', fail_count,
    'duration_seconds', EXTRACT(EPOCH FROM (clock_timestamp() - start_time)),
    'timestamp', NOW(),
    'debug', debug_info
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'debug', debug_info
  );
END;
$$; 