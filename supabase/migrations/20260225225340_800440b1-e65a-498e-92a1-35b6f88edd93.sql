-- Add FK from task_comments.user_id to profiles.id for join support
ALTER TABLE public.task_comments 
  ADD CONSTRAINT task_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;