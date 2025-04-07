
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
  api_key text := 'sk-RvFfxZ1tYT0cWAJFhvDwJHyZsYv6i92PopjT9VaQzG7dxfss';
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
    SELECT s.*, d.task_type, d.additional_params 
    FROM public.video_generation_task_statuses s
    JOIN public.video_generation_task_definitions d ON s.task_id = d.id 
    WHERE s.status IN ('processing', 'pending', 'queued')
    AND d.task_type = 'i2v'  -- 只处理图生视频任务
    ORDER BY s.updated_at ASC
    LIMIT batch_size
  LOOP
    processed_count := processed_count + 1;
    use_fallback := false;
    
    -- 检查任务是否包含官方API基础URL
    DECLARE
      task_api_endpoint text := NULL;
      is_official_api boolean := false;
    BEGIN
      -- 尝试从 additional_params 中提取 api_endpoint
      IF task.additional_params IS NOT NULL AND task.additional_params ? 'api_endpoint' THEN
        task_api_endpoint := task.additional_params->>'api_endpoint';
        
        -- 检查是否包含官方API基础URL
        IF task_api_endpoint IS NOT NULL AND task_api_endpoint LIKE '%' || api_base_url || '%' THEN
          is_official_api := true;
        END IF;
      END IF;
      
      debug_info := array_append(debug_info, json_build_object(
        'task_id', task.id,
        'external_task_id', task.external_task_id,
        'api_endpoint', task_api_endpoint,
        'is_official_api', is_official_api
      ));
      
      -- 如果不是官方API任务，跳过处理
      IF NOT is_official_api THEN
        debug_info := array_append(debug_info, json_build_object(
          'skipped_non_official', true,
          'task_id', task.id
        ));
        CONTINUE;
      END IF;
    END;
    
    debug_info := array_append(debug_info, json_build_object(
      'task_id', task.id,
      'external_task_id', task.external_task_id,
      'current_status', task.status,
      'task_type', task.task_type
    ));
    
    BEGIN
      -- 首先，检查是否应该直接更新基于时间的状态
      IF task.status = 'processing' AND (EXTRACT(EPOCH FROM (NOW() - task.updated_at)) / 3600) > 24 THEN
        -- 任务处理超过24小时，可能卡住，直接标记为失败
        new_status := 'failed';
        my_error_message := '任务处理超时，可能卡住';
        use_fallback := true;
        
        debug_info := array_append(debug_info, json_build_object(
          'status_change', json_build_object(
            'from', task.status,
            'to', new_status,
            'reason', 'timeout_without_api_call'
          )
        ));
      ELSE
        -- 构建 302.ai 的任务查询 URL
        task_url := api_base_url || '/klingai/task/' || task.external_task_id || '/fetch';
        
        debug_info := array_append(debug_info, json_build_object(
          'using_direct_api_url', task_url
        ));
        
        BEGIN
          -- 使用http扩展发送GET请求
          SELECT * FROM http_get(
            task_url,
            ARRAY[('X-API-KEY', api_key)]::http_header[]
          ) INTO http_resp;
          
          -- 记录完整的响应信息
          debug_info := array_append(debug_info, json_build_object(
            'http_response', json_build_object(
              'status', http_resp.status,
              'content_type', http_resp.content_type,
              'content', http_resp.content
            )
          ));
          
          -- 检查响应
          IF http_resp.status = 200 AND http_resp.content IS NOT NULL THEN
            api_response := http_resp.content::json;
            
            -- 从响应中提取状态和 URL
            IF api_response->'data'->>'status' IS NOT NULL THEN
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
                  'api_status_parsed', json_build_object(
                    'api_status', api_status,
                    'new_status', new_status,
                    'video_url', my_result_url,
                    'cover_url', my_thumbnail_url,
                    'full_response', api_response
                  )
                ));
              END;
            END IF;
          ELSE
            use_fallback := true;
            debug_info := array_append(debug_info, json_build_object(
              'external_task_id', task.external_task_id,
              'http_error', json_build_object(
                'status', http_resp.status,
                'content', http_resp.content
              )
            ));
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- 记录HTTP错误并使用后备逻辑
          use_fallback := true;
          debug_info := array_append(debug_info, json_build_object(
            'http_request_error', json_build_object(
              'task_id', task.id,
              'error', SQLERRM
            )
          ));
        END;
        
        -- 如果API调用失败，尝试通过本地规则推断状态
        IF use_fallback THEN
          debug_info := array_append(debug_info, json_build_object(
            'using_fallback_logic', true
          ));
          
          -- 基于时间的启发式规则
          DECLARE
            hours_since_update NUMERIC := EXTRACT(EPOCH FROM (NOW() - task.updated_at)) / 3600;
          BEGIN
            -- 更复杂的规则判断
            IF task.status = 'processing' THEN
              IF hours_since_update > 24 THEN
                -- 如果处理超过24小时，认为已失败
                new_status := 'failed';
                my_error_message := '任务处理超过24小时未完成，可能失败';
              ELSIF hours_since_update > 12 AND hours_since_update <= 24 THEN
                -- 如果处理超过12小时但少于24小时，标记为风险但继续保持处理状态
                debug_info := array_append(debug_info, json_build_object(
                  'processing_warning', '任务处理超过12小时，可能存在风险'
                ));
              END IF;
            ELSIF task.status = 'queued' AND hours_since_update > 6 THEN
              -- 如果排队超过6小时，切换到处理中状态（假设已开始处理）
              new_status := 'processing';
              debug_info := array_append(debug_info, json_build_object(
                'queue_status_change', '任务排队超过6小时，假设已开始处理'
              ));
            END IF;
          END;
        END IF;
      END IF;
      
      -- 更新数据库
      IF new_status IS NOT NULL AND (new_status <> task.status OR my_result_url IS NOT NULL) THEN
        -- 暂存当前值，避免引用歧义
        DECLARE
          current_result_url text := task.result_url;
          current_thumbnail_url text := task.thumbnail_url;
          current_error_message text := task.error_message;
        BEGIN
          UPDATE public.video_generation_task_statuses
          SET 
            status = new_status,
            result_url = CASE WHEN my_result_url IS NOT NULL THEN my_result_url ELSE current_result_url END,
            thumbnail_url = CASE WHEN my_thumbnail_url IS NOT NULL THEN my_thumbnail_url ELSE current_thumbnail_url END,
            error_message = CASE WHEN my_error_message IS NOT NULL THEN my_error_message ELSE current_error_message END,
            updated_at = NOW()
          WHERE id = task.id;
          
          success_count := success_count + 1;
          debug_info := array_append(debug_info, json_build_object(
            'database_update', 'success',
            'task_id', task.id,
            'new_status', new_status,
            'result_url', CASE WHEN my_result_url IS NOT NULL THEN my_result_url ELSE current_result_url END
          ));
        END;
      ELSE
        debug_info := array_append(debug_info, json_build_object(
          'database_update', 'skipped',
          'reason', 'no change needed'
        ));
      END IF;
      
      -- 重置变量为下一次迭代
      new_status := NULL;
      my_result_url := NULL;
      my_thumbnail_url := NULL;
      my_error_message := NULL;
      
    EXCEPTION WHEN OTHERS THEN
      fail_count := fail_count + 1;
      debug_info := array_append(debug_info, json_build_object(
        'task_error', json_build_object(
          'task_id', task.id,
          'error', SQLERRM
        )
      ));
    END;
    
    -- 检查是否已经运行太长时间
    IF EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) > 25 THEN
      debug_info := array_append(debug_info, json_build_object('early_exit', 'time_limit_reached'));
      EXIT;
    END IF;
    
    -- 添加每个任务处理之间的小延迟，避免并发请求可能导致的问题
    PERFORM pg_sleep(0.5);
  END LOOP;
  
  -- 返回处理结果
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
    'timestamp', NOW(),
    'debug', debug_info
  );
END;
