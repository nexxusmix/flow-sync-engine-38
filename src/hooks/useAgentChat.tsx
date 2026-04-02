import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAgentExecution } from './useAgentExecution';
import { toast } from 'sonner';
import type {
  AgentConversation,
  AgentMessage,
  AgentMemory,
  ExecutionPlan,
  AttachmentInfo,
} from '@/types/agent';
import type { Json } from '@/integrations/supabase/types';
import { DEFAULT_WORKSPACE_ID } from '@/constants/workspace';
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/polo-ai-chat`;

export function useAgentChat() {
  const { user, session } = useAuth();
  const { createRun, updateRunPlan, executePlan, isExecuting } = useAgentExecution();

  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [memories, setMemories] = useState<AgentMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      const { data } = await supabase
        .from('agent_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(30);
      setConversations((data || []) as unknown as AgentConversation[]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // ── Load messages for a conversation ──
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (data) {
      const msgs: AgentMessage[] = data.map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        files: m.attachments as AttachmentInfo[] | undefined,
        plan: m.plan_json as ExecutionPlan | undefined,
        results: m.result_json?.actions,
        runId: m.run_id || undefined,
        dbId: m.id,
      }));
      setMessages(msgs);
    }
  }, []);

  // ── Load memories ──
  const loadMemories = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('agent_memory')
      .select('*')
      .eq('user_id', user.id)
      .limit(50);
    setMemories((data || []) as unknown as AgentMemory[]);
  }, [user]);

  // ── Create new conversation ──
  const createConversation = useCallback(async (title?: string): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('agent_conversations')
      .insert({
        user_id: user.id,
        workspace_id: DEFAULT_WORKSPACE_ID,
        title: title || 'Nova conversa',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create conversation:', error);
      return null;
    }
    const conv = data as unknown as AgentConversation;
    setConversations(prev => [conv, ...prev]);
    setActiveConversationId(conv.id);
    setMessages([]);
    return conv.id;
  }, [user]);

  // ── Select conversation ──
  const selectConversation = useCallback(async (id: string) => {
    setActiveConversationId(id);
    await loadMessages(id);
  }, [loadMessages]);

  // ── Delete conversation ──
  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from('agent_conversations').update({ is_active: false }).eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [activeConversationId]);

  // ── Save message to DB ──
  const saveMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    extras?: {
      attachments?: AttachmentInfo[];
      plan?: ExecutionPlan;
      result?: any;
      runId?: string;
    }
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from('agent_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        attachments: (extras?.attachments || null) as unknown as Json,
        plan_json: (extras?.plan || null) as unknown as Json,
        result_json: (extras?.result || null) as unknown as Json,
        run_id: extras?.runId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to save message:', error);
      return null;
    }
    return data?.id || null;
  }, []);

  // ── Update conversation title from first message ──
  const updateConversationTitle = useCallback(async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '...' : '');
    await supabase
      .from('agent_conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, title } : c)
    );
  }, []);

  // ── Parse execution plan from AI response ──
  const parseExecutionPlan = useCallback((content: string): { text: string; plan: ExecutionPlan | null } => {
    const planMatch = content.match(/```json\s*\n?\s*(\{[\s\S]*?"execution_plan"[\s\S]*?\})\s*\n?\s*```/);
    if (planMatch) {
      try {
        const parsed = JSON.parse(planMatch[1]);
        const plan = parsed.execution_plan as ExecutionPlan;
        const textWithoutPlan = content.replace(planMatch[0], '').trim();
        return { text: textWithoutPlan, plan };
      } catch {
        return { text: content, plan: null };
      }
    }
    return { text: content, plan: null };
  }, []);

  // ── Stream chat ──
  const sendMessage = useCallback(async (
    inputText: string,
    files: AttachmentInfo[] = [],
    currentRoute?: string,
  ) => {
    if (!user || !session) {
      toast.error('Faça login para usar o Polo AI');
      return;
    }
    if (isLoading) return;

    setIsLoading(true);

    // Ensure we have a conversation
    let convId = activeConversationId;
    const isNewConversation = !convId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) {
        setIsLoading(false);
        return;
      }
    }

    // Add user message to UI
    const userMsg: AgentMessage = { role: 'user', content: inputText, files: files.length > 0 ? files : undefined };
    setMessages(prev => [...prev, userMsg]);

    // Save user message to DB
    await saveMessage(convId, 'user', inputText, { attachments: files });

    // Update title on first message
    if (isNewConversation) {
      await updateConversationTitle(convId, inputText);
    }

    // Touch conversation updated_at
    await supabase.from('agent_conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);

    // Build messages for API (include file contents)
    const apiMessages = messages.concat(userMsg).map(m => {
      let content = m.content;
      if (m.files && m.files.length > 0) {
        const fileContents = m.files.map(f =>
          `\n\n---\n📎 **Arquivo: ${f.name}** (${(f.size / 1024).toFixed(1)}KB)\n${f.content || '[Conteúdo não disponível]'}\n---`
        ).join('');
        content += fileContents;
      }
      return { role: m.role, content };
    });

    // Build memory context
    const memoryContext = memories.length > 0
      ? memories.map(m => `${m.key}: ${JSON.stringify(m.value)}`).join('\n')
      : '';

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          context: {
            currentRoute,
            timestamp: new Date().toISOString(),
            conversationId: convId,
            workspaceId: DEFAULT_WORKSPACE_ID,
            memories: memoryContext,
          },
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        if (resp.status === 429) { toast.error('Limite de requisições excedido.'); throw new Error('Rate limited'); }
        if (resp.status === 402) { toast.error('Créditos de IA insuficientes.'); throw new Error('Payment required'); }
        throw new Error('AI gateway error');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'assistant', content: assistantContent };
                return newMsgs;
              });
            }
          } catch { break; }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'assistant', content: assistantContent };
                return newMsgs;
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Parse execution plan
      const { text, plan } = parseExecutionPlan(assistantContent);
      const finalMsg: AgentMessage = {
        role: 'assistant',
        content: text,
        plan: plan || undefined,
        needsConfirmation: plan?.needs_confirmation,
      };

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = finalMsg;
        return newMsgs;
      });

      // Save assistant message to DB
      await saveMessage(convId, 'assistant', assistantContent, { plan: plan || undefined });

      // Auto-execute low-risk plans (OUTSIDE setMessages to avoid React anti-pattern)
      if (plan && plan.risk_level === 'low' && !plan.needs_confirmation) {
        setTimeout(() => {
          autoExecutePlan(plan, convId!);
        }, 0);
      }

    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Chat error:', error);
      if (!(error instanceof Error && (error.message === 'Rate limited' || error.message === 'Payment required'))) {
        toast.error('Erro ao processar sua solicitação.');
      }
      setMessages(prev => prev.filter(m => m.content !== ''));
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [user, session, activeConversationId, messages, memories, isLoading, createConversation, saveMessage, updateConversationTitle, parseExecutionPlan]);

  // ── Auto-execute plan (with full feedback in chat) ──
  const autoExecutePlan = useCallback(async (plan: ExecutionPlan, conversationId: string) => {
    // Add "executing" indicator message
    setMessages(prev => {
      const lastAssistantIdx = prev.length - 1;
      const newMsgs = [...prev];
      if (lastAssistantIdx >= 0 && newMsgs[lastAssistantIdx].role === 'assistant') {
        newMsgs[lastAssistantIdx] = { ...newMsgs[lastAssistantIdx], isAutoExecuting: true };
      }
      return newMsgs;
    });

    const runId = await createRun('Auto-execução Polo AI', [], {});
    if (!runId) return;

    await updateRunPlan(runId, plan);
    
    // Update the last assistant message with runId
    setMessages(prev => {
      const newMsgs = [...prev];
      const lastAssistantIdx = newMsgs.map(m => m.role).lastIndexOf('assistant');
      if (lastAssistantIdx >= 0) {
        newMsgs[lastAssistantIdx] = { ...newMsgs[lastAssistantIdx], runId };
      }
      return newMsgs;
    });

    const result = await executePlan(runId, plan);
    
    // Remove executing indicator
    setMessages(prev => {
      const newMsgs = [...prev];
      const idx = newMsgs.findIndex(m => m.runId === runId);
      if (idx >= 0) {
        newMsgs[idx] = { ...newMsgs[idx], isAutoExecuting: false, results: result?.actions, needsConfirmation: false };
      }
      return newMsgs;
    });

    if (result) {
      const successCount = result.actions.filter((a: any) => a.status === 'success').length;
      const failedActions = result.actions.filter((a: any) => a.status === 'error');

      if (failedActions.length === 0) {
        toast.success('✔️ Execução automática concluída!');
        // Post success feedback message
        const feedbackContent = `✅ **Execução automática concluída!** Todas as ${successCount} ações foram executadas com sucesso.`;
        setMessages(prev => [...prev, { role: 'assistant' as const, content: feedbackContent }]);
        await saveMessage(conversationId, 'assistant', feedbackContent);
      } else {
        const errorLines = failedActions.map((a: any) => {
          const actionName = a.action_type || 'ação';
          const entityName = a.entity_type || '';
          return `- **${actionName}** ${entityName}: ${a.error_message}`;
        }).join('\n');
        const feedbackContent = `⚠️ **Execução com ${failedActions.length} erro(s)**\n\n${successCount} ações ok, ${failedActions.length} falharam:\n\n${errorLines}\n\nClique em **Regenerar Plano** acima para corrigir.`;
        setMessages(prev => [...prev, { role: 'assistant' as const, content: feedbackContent }]);
        await saveMessage(conversationId, 'assistant', feedbackContent);
        toast.warning(`Execução com ${failedActions.length} erro(s)`);
      }
    }
  }, [createRun, updateRunPlan, executePlan, saveMessage]);

  // ── Manual execute plan ──
  const handleExecutePlan = useCallback(async (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message.plan) return;

    const runId = await createRun(
      messages[messageIndex - 1]?.content || 'Execução via chat',
      [], {}
    );
    if (!runId) return;

    await updateRunPlan(runId, message.plan);

    setMessages(prev => {
      const newMsgs = [...prev];
      newMsgs[messageIndex] = { ...newMsgs[messageIndex], runId };
      return newMsgs;
    });

    const result = await executePlan(runId, message.plan);
    if (result) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[messageIndex] = {
          ...newMsgs[messageIndex],
          results: result.actions,
          needsConfirmation: false,
        };
        return newMsgs;
      });

      // Update message in DB with result
      if (activeConversationId && message.dbId) {
        await supabase
          .from('agent_messages')
          .update({ result_json: result as unknown as Json, run_id: runId })
          .eq('id', message.dbId);
      }

      if (result.errors.length === 0) {
        toast.success('Execução concluída com sucesso!');
        const successCount = result.actions.filter((a: any) => a.status === 'success').length;
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: `✅ **Execução concluída!** Todas as ${successCount} ações foram executadas com sucesso.`,
        }]);
      } else {
        const successCount = result.actions.filter((a: any) => a.status === 'success').length;
        const failedActions = result.actions.filter((a: any) => a.status === 'error');
        const errorLines = failedActions.map((a: any) => {
          const actionName = a.action_type || 'ação';
          const entityName = a.entity_type || '';
          return `- **${actionName}** ${entityName}: ${a.error_message}`;
        }).join('\n');
        
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: `⚠️ **Execução com ${result.errors.length} erro(s)**\n\n${successCount} ações ok, ${failedActions.length} falharam:\n\n${errorLines}\n\nClique em **Regenerar Plano** acima para tentar novamente ou **Executar Tudo** para reexecutar.`,
        }]);
        toast.warning(`Execução com ${result.errors.length} erro(s)`);
      }
    }
  }, [messages, createRun, updateRunPlan, executePlan, activeConversationId]);

  // ── Regenerate plan for a message ──
  const regeneratePlan = useCallback(async (messageIndex: number, currentRoute?: string) => {
    if (!user || !session || isLoading) return;

    const assistantMsg = messages[messageIndex];
    if (!assistantMsg?.plan) return;

    // Find the user message that generated this plan (the one right before)
    const userMsg = messages[messageIndex - 1];
    if (!userMsg || userMsg.role !== 'user') {
      toast.error('Não foi possível encontrar a mensagem original.');
      return;
    }

    const convId = activeConversationId;
    if (!convId) return;

    setIsLoading(true);

    // Build messages for API (all messages up to and including the user message)
    const apiMessages = messages.slice(0, messageIndex).map(m => {
      let content = m.content;
      if (m.files && m.files.length > 0) {
        const fileContents = m.files.map(f =>
          `\n\n---\n📎 **Arquivo: ${f.name}** (${(f.size / 1024).toFixed(1)}KB)\n${f.content || '[Conteúdo não disponível]'}\n---`
        ).join('');
        content += fileContents;
      }
      return { role: m.role, content };
    });

    const memoryContext = memories.length > 0
      ? memories.map(m => `${m.key}: ${JSON.stringify(m.value)}`).join('\n')
      : '';

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      // Mark as regenerating in UI
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[messageIndex] = { ...newMsgs[messageIndex], content: '🔄 Regenerando plano...', plan: undefined, results: undefined };
        return newMsgs;
      });

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          context: {
            currentRoute,
            timestamp: new Date().toISOString(),
            conversationId: convId,
            workspaceId: DEFAULT_WORKSPACE_ID,
            memories: memoryContext,
          },
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error('AI gateway error');
      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[messageIndex] = { ...newMsgs[messageIndex], content: assistantContent };
                return newMsgs;
              });
            }
          } catch { break; }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) assistantContent += content;
          } catch { /* ignore */ }
        }
      }

      // Parse new plan
      const { text, plan } = parseExecutionPlan(assistantContent);
      const finalMsg: AgentMessage = {
        ...assistantMsg,
        content: text,
        plan: plan || undefined,
        results: undefined,
        runId: undefined,
        needsConfirmation: plan?.needs_confirmation,
      };

      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[messageIndex] = finalMsg;
        return newMsgs;
      });

      // Update in DB
      if (assistantMsg.dbId) {
        await supabase
          .from('agent_messages')
          .update({
            content: assistantContent,
            plan_json: (plan || null) as unknown as Json,
            result_json: null,
            run_id: null,
          })
          .eq('id', assistantMsg.dbId);
      }

      toast.success('Plano regenerado com sucesso!');
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      console.error('Regenerate error:', error);
      toast.error('Erro ao regenerar plano.');
      // Restore original message
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[messageIndex] = assistantMsg;
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [user, session, isLoading, messages, memories, activeConversationId, parseExecutionPlan]);

  // ── Delete memory ──
  const deleteMemory = useCallback(async (id: string) => {
    await supabase.from('agent_memory').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  // ── Cancel streaming ──
  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  // ── Init on mount ──
  useEffect(() => {
    if (user) {
      loadConversations();
      loadMemories();
    }
  }, [user, loadConversations, loadMemories]);

  return {
    conversations,
    activeConversationId,
    messages,
    memories,
    isLoading,
    isLoadingConversations,
    isExecuting,
    sendMessage,
    selectConversation,
    createConversation,
    deleteConversation,
    handleExecutePlan,
    regeneratePlan,
    deleteMemory,
    cancelStream,
    setMessages,
  };
}
