-- 为video_generation_task_definitions表启用RLS
ALTER TABLE video_generation_task_definitions ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "用户可以创建自己的视频任务" ON video_generation_task_definitions;
DROP POLICY IF EXISTS "用户可以查看自己的视频任务" ON video_generation_task_definitions;

-- 创建正确的RLS策略
CREATE POLICY "用户可以创建自己的视频任务" 
ON video_generation_task_definitions 
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以查看自己的视频任务" 
ON video_generation_task_definitions 
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 为video_generation_task_statuses表启用RLS
ALTER TABLE video_generation_task_statuses ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Users can insert their task statuses" ON video_generation_task_statuses;
DROP POLICY IF EXISTS "Users can view their task statuses" ON video_generation_task_statuses;

-- 创建正确的RLS策略
CREATE POLICY "Users can insert their task statuses" 
ON video_generation_task_statuses 
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 
  FROM video_generation_task_definitions 
  WHERE id = video_generation_task_statuses.task_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can view their task statuses" 
ON video_generation_task_statuses 
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 
  FROM video_generation_task_definitions 
  WHERE id = video_generation_task_statuses.task_id 
  AND user_id = auth.uid()
));

-- 确保只有已认证的用户可以访问这些表
GRANT SELECT, INSERT ON video_generation_task_definitions TO authenticated;
GRANT SELECT, INSERT ON video_generation_task_statuses TO authenticated;

-- 为service_role添加额外的访问策略，允许cron任务访问所有记录

-- 为video_generation_task_statuses表添加服务角色访问策略
CREATE POLICY "Service role can access all task statuses"
ON video_generation_task_statuses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 为video_generation_task_definitions表添加服务角色访问策略
CREATE POLICY "Service role can access all task definitions"
ON video_generation_task_definitions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 授予服务角色对表的所有权限
GRANT ALL ON video_generation_task_definitions TO service_role;
GRANT ALL ON video_generation_task_statuses TO service_role; 