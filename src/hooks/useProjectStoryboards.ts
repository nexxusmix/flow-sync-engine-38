import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface StoryboardScene {
  id?: string;
  storyboard_id?: string;
  scene_number: number;
  title: string;
  description: string;
  direction: string;
  lens: string;
  fps: string;
  camera_movement: string;
  lighting: string;
  mood: string;
  color_grading: string;
  production_type: string;
  ai_prompt: string;
  negative_prompt: string;
}

export interface Storyboard {
  id: string;
  project_id: string;
  title: string;
  source_type: string;
  source_text?: string;
  style_global: string;
  created_at: string;
  scenes?: StoryboardScene[];
}

export const COLOR_GRADINGS = [
  "Agfa Vista 800", "Contax T2/T3", "Film Look 16mm", "Film Look 8mm",
  "Preto e Branco cinematográfico", "Color coringa filme", "Interestelar",
  "Tenet", "Ferrari (Enzo Ferrari)", "Oppenheimer", "CRT Soft VHS",
  "iPhone clean", "Original neutro",
];

export const PRODUCTION_TYPES: Record<string, string> = {
  motion: "Motion",
  motion_3d: "Motion 3D",
  vfx: "VFX",
  video_real: "Vídeo Real",
  fotografia_still: "Fotografia Still",
  mixed_media: "Mixed Media",
};

export function useProjectStoryboards(projectId: string | undefined) {
  const queryClient = useQueryClient();

  const storyboardsQuery = useQuery({
    queryKey: ["project-storyboards", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_storyboards")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Storyboard[];
    },
    enabled: !!projectId,
  });

  const scenesQuery = (storyboardId: string) =>
    useQuery({
      queryKey: ["storyboard-scenes", storyboardId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("project_storyboard_scenes")
          .select("*")
          .eq("storyboard_id", storyboardId)
          .order("scene_number", { ascending: true });
        if (error) throw error;
        return data as StoryboardScene[];
      },
      enabled: !!storyboardId,
    });

  const generateMutation = useMutation({
    mutationFn: async (params: {
      sourceText: string;
      title: string;
      sourceType: string;
      colorGrading: string;
      projectName?: string;
      clientName?: string;
      objective?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Call edge function
      const { data: aiData, error: aiError } = await supabase.functions.invoke("generate-storyboard-ai", {
        body: {
          sourceText: params.sourceText,
          projectName: params.projectName,
          clientName: params.clientName,
          colorGrading: params.colorGrading,
          objective: params.objective,
        },
      });

      if (aiError) throw new Error(aiError.message || "Erro ao gerar storyboard");
      if (aiData?.error) throw new Error(aiData.error);

      // Save storyboard
      const { data: sb, error: sbError } = await supabase
        .from("project_storyboards")
        .insert({
          project_id: projectId!,
          title: params.title,
          source_type: params.sourceType,
          source_text: params.sourceText,
          style_global: params.colorGrading,
          created_by: user.id,
        })
        .select("id")
        .single();

      if (sbError) throw sbError;

      // Save scenes
      const scenes = (aiData.scenes || []).map((s: StoryboardScene) => ({
        storyboard_id: sb.id,
        scene_number: s.scene_number,
        title: s.title,
        description: s.description,
        direction: s.direction,
        lens: s.lens,
        fps: s.fps,
        camera_movement: s.camera_movement,
        lighting: s.lighting,
        mood: s.mood,
        color_grading: s.color_grading || params.colorGrading,
        production_type: s.production_type,
        ai_prompt: s.ai_prompt,
        negative_prompt: s.negative_prompt,
      }));

      if (scenes.length > 0) {
        const { error: scenesError } = await supabase
          .from("project_storyboard_scenes")
          .insert(scenes);
        if (scenesError) throw scenesError;
      }

      return { storyboardId: sb.id, scenesCount: scenes.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-storyboards", projectId] });
      toast.success(`Storyboard gerado com ${data.scenesCount} cenas!`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao gerar storyboard");
    },
  });

  const updateScene = useMutation({
    mutationFn: async (params: { sceneId: string; updates: Partial<StoryboardScene> }) => {
      const { error } = await supabase
        .from("project_storyboard_scenes")
        .update(params.updates)
        .eq("id", params.sceneId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storyboard-scenes"] });
    },
  });

  const deleteStoryboard = useMutation({
    mutationFn: async (storyboardId: string) => {
      const { error } = await supabase
        .from("project_storyboards")
        .delete()
        .eq("id", storyboardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-storyboards", projectId] });
      toast.success("Storyboard removido");
    },
  });

  return {
    storyboards: storyboardsQuery.data || [],
    isLoading: storyboardsQuery.isLoading,
    scenesQuery,
    generate: generateMutation,
    updateScene,
    deleteStoryboard,
  };
}
