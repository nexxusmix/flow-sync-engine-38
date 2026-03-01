import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropZone } from '@/components/ui/DropZone';
import { useInstagramAI, useProfileConfig, useProfileSnapshots } from '@/hooks/useInstagramEngine';
import { useInsightsReports, useSaveInsightsReport } from '@/hooks/useInsightsReports';
import { Loader2, Sparkles, FileText, X, TrendingUp, AlertTriangle, Calendar, Target, Lightbulb, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function InsightsAnalyzerTab() {
  const [textInput, setTextInput] = useState('');
  const [command, setCommand] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    diagnosis: true, actions: true, calendar: false, projections: false, guidance: false, alerts: true, consistency: false, top: false,
  });

  const { data: config } = useProfileConfig();
  const { data: snapshots } = useProfileSnapshots();
  const aiMutation = useInstagramAI();
  const { data: pastReports } = useInsightsReports();
  const saveReport = useSaveInsightsReport();

  const handleFiles = useCallback((f: File[]) => setFiles(prev => [...prev, ...f]), []);

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleAnalyze = async () => {
    if (!textInput.trim() && files.length === 0 && !command.trim()) {
      toast.error('Cole dados, suba arquivos ou dê um comando para análise.');
      return;
    }
    setIsAnalyzing(true);
    try {
      let fileContent = '';
      if (files.length > 0) {
        const texts = await Promise.all(files.map(f => f.text().catch(() => `[arquivo binário: ${f.name}]`)));
        fileContent = texts.join('\n---\n');
      }

      const latestSnapshot = snapshots?.[0];
      const profileContext = config ? {
        handle: config.profile_handle,
        niche: config.niche,
        followers: latestSnapshot?.followers,
        posts_count: latestSnapshot?.posts_count,
        avg_engagement: latestSnapshot?.avg_engagement,
      } : undefined;

      const result = await aiMutation.mutateAsync({
        action: 'analyze_insights',
        data: {
          text_input: textInput || undefined,
          file_content: fileContent || undefined,
          command: command || undefined,
          profile_context: profileContext,
        },
      });

      if (!result) throw new Error('IA não retornou resultado');
      setCurrentReport(result);

      // Save report
      await saveReport.mutateAsync({
        input_text: textInput || command || 'Análise via arquivos',
        input_files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
        command: command || null,
        report_json: result,
        report_type: 'full',
      });

      toast.success('Relatório gerado com sucesso! 📊');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao analisar insights');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const report = currentReport;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="glass-card border border-border/50">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            <h3 className="text-sm font-medium text-foreground">Central de Análise de Insights</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole dados do Instagram Insights, suba prints/relatórios ou dê comandos livres. A IA gera diagnóstico, ações, calendário, projeções e orientações.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">📋 Cole dados dos Insights aqui</Label>
                <Textarea
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Cole aqui os dados do Instagram Insights: alcance, impressões, seguidores ganhos, engajamento, dados de stories, etc..."
                  className="mt-1 min-h-[120px] text-xs"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">💬 Comando / Instrução (opcional)</Label>
                <Input
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  placeholder="Ex: Foque na análise de alcance dos últimos 30 dias e sugira melhorias..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Arquivos / Screenshots dos Insights
                </Label>
                <DropZone onFiles={handleFiles} compact accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.webp,.doc,.docx" />
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {files.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-full">
                        <FileText className="w-3 h-3" />
                        {f.name}
                        <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full gap-2 bg-primary hover:bg-primary/90 h-11">
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isAnalyzing ? 'Analisando com IA...' : 'Analisar Insights com IA'}
          </Button>
        </CardContent>
      </Card>

      {/* Report Results */}
      {report && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Diagnosis */}
          {report.diagnosis && (
            <ReportSection title="Diagnóstico" icon={<BarChart3 className="w-4 h-4" />} sectionKey="diagnosis" expanded={expandedSections.diagnosis} onToggle={toggleSection}>
              <div className="space-y-3">
                {report.diagnosis.health_score !== undefined && (
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold ${report.diagnosis.health_score >= 70 ? 'text-emerald-400' : report.diagnosis.health_score >= 40 ? 'text-amber-400' : 'text-destructive'}`}>
                      {report.diagnosis.health_score}
                    </div>
                    <div className="text-xs text-muted-foreground">Score de Saúde</div>
                  </div>
                )}
                <p className="text-xs text-foreground leading-relaxed">{report.diagnosis.summary}</p>
                {report.diagnosis.key_metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {report.diagnosis.key_metrics.map((m: any, i: number) => (
                      <div key={i} className="bg-muted/30 rounded-lg p-2.5 text-center">
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                        <p className="text-sm font-bold text-foreground">{m.value}</p>
                        {m.trend && <Badge variant="outline" className="text-[9px] mt-1">{m.trend === 'up' ? '📈' : m.trend === 'down' ? '📉' : '➡️'} {m.trend}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ReportSection>
          )}

          {/* Alerts */}
          {report.alerts && report.alerts.length > 0 && (
            <ReportSection title="Alertas" icon={<AlertTriangle className="w-4 h-4" />} sectionKey="alerts" expanded={expandedSections.alerts} onToggle={toggleSection}>
              <div className="space-y-2">
                {report.alerts.map((a: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${a.severity === 'high' ? 'bg-destructive/10 border border-destructive/20' : a.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted/30'}`}>
                    <span className="text-sm">{a.type === 'risk' ? '⚠️' : '💡'}</span>
                    <div>
                      <p className="text-xs font-medium text-foreground">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
                      {a.action && <p className="text-[10px] text-primary mt-1">→ {a.action}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}

          {/* Priority Actions */}
          {report.priority_actions && (
            <ReportSection title="Ações Prioritárias" icon={<Target className="w-4 h-4" />} sectionKey="actions" expanded={expandedSections.actions} onToggle={toggleSection}>
              <div className="space-y-2">
                {report.priority_actions.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-sm font-bold text-primary">#{a.priority || i + 1}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
                      <div className="flex gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[9px]">Impacto: {a.impact}</Badge>
                        <Badge variant="outline" className="text-[9px]">Esforço: {a.effort}</Badge>
                        {a.deadline && <Badge variant="secondary" className="text-[9px]">{a.deadline}</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}

          {/* Suggested Calendar */}
          {report.suggested_calendar && (
            <ReportSection title="Calendário Sugerido" icon={<Calendar className="w-4 h-4" />} sectionKey="calendar" expanded={expandedSections.calendar} onToggle={toggleSection}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {report.suggested_calendar.map((c: any, i: number) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[9px]">{c.day} {c.time}</Badge>
                      <Badge variant="outline" className="text-[9px]">{c.format}</Badge>
                    </div>
                    <p className="text-xs font-medium text-foreground">{c.topic}</p>
                    {c.hook && <p className="text-[10px] text-muted-foreground italic">"{c.hook}"</p>}
                    <Badge className="text-[9px] bg-primary/10 text-primary">{c.pillar}</Badge>
                  </div>
                ))}
              </div>
            </ReportSection>
          )}

          {/* Projections */}
          {report.projections && (
            <ReportSection title="Projeções" icon={<TrendingUp className="w-4 h-4" />} sectionKey="projections" expanded={expandedSections.projections} onToggle={toggleSection}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {report.projections.followers_30d && (
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">Seguidores 30d</p>
                      <p className="text-lg font-bold text-foreground">{report.projections.followers_30d}</p>
                    </div>
                  )}
                  {report.projections.followers_90d && (
                    <div className="bg-muted/30 rounded-lg p-3 text-center">
                      <p className="text-[10px] text-muted-foreground">Seguidores 90d</p>
                      <p className="text-lg font-bold text-foreground">{report.projections.followers_90d}</p>
                    </div>
                  )}
                </div>
                {report.projections.engagement_trend && <p className="text-xs text-muted-foreground">📈 Engajamento: {report.projections.engagement_trend}</p>}
                {report.projections.reach_trend && <p className="text-xs text-muted-foreground">👁️ Alcance: {report.projections.reach_trend}</p>}
                {report.projections.growth_scenarios && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                    {report.projections.growth_scenarios.map((s: any, i: number) => (
                      <div key={i} className="bg-muted/30 rounded-lg p-3">
                        <Badge variant="outline" className="text-[9px] mb-1">{s.scenario}</Badge>
                        <p className="text-sm font-bold text-foreground">{s.followers_90d} seg</p>
                        <p className="text-[10px] text-muted-foreground">{s.actions_needed}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ReportSection>
          )}

          {/* Content Guidance */}
          {report.content_guidance && (
            <ReportSection title="Orientações de Conteúdo" icon={<Lightbulb className="w-4 h-4" />} sectionKey="guidance" expanded={expandedSections.guidance} onToggle={toggleSection}>
              <div className="space-y-3">
                {report.content_guidance.best_formats && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Melhores Formatos</p>
                    <div className="flex flex-wrap gap-2">
                      {report.content_guidance.best_formats.map((f: any, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px]">{f.format} — {f.reason}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {report.content_guidance.best_times && (
                  <p className="text-xs text-muted-foreground">🕐 Melhores horários: {report.content_guidance.best_times.join(', ')}</p>
                )}
                {report.content_guidance.best_days && (
                  <p className="text-xs text-muted-foreground">📅 Melhores dias: {report.content_guidance.best_days.join(', ')}</p>
                )}
                {report.content_guidance.trending_topics && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Temas em Alta</p>
                    <div className="flex flex-wrap gap-1.5">
                      {report.content_guidance.trending_topics.map((t: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {report.content_guidance.avoid && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-destructive/80 font-medium mb-1">Evitar</p>
                    <ul className="text-[10px] text-muted-foreground space-y-0.5">
                      {report.content_guidance.avoid.map((a: string, i: number) => <li key={i}>❌ {a}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </ReportSection>
          )}

          {/* Consistency Score */}
          {report.consistency_score && (
            <ReportSection title="Score de Consistência" icon={<BarChart3 className="w-4 h-4" />} sectionKey="consistency" expanded={expandedSections.consistency} onToggle={toggleSection}>
              <div className="flex items-center gap-4">
                <div className={`text-3xl font-bold ${report.consistency_score.score >= 70 ? 'text-emerald-400' : report.consistency_score.score >= 40 ? 'text-amber-400' : 'text-destructive'}`}>
                  {report.consistency_score.score}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Posts últimos 7d: {report.consistency_score.posts_last_7d}</p>
                  <p>Posts últimos 30d: {report.consistency_score.posts_last_30d}</p>
                  <p>Frequência ideal: {report.consistency_score.ideal_frequency}/sem</p>
                  {report.consistency_score.note && <p className="text-primary">{report.consistency_score.note}</p>}
                </div>
              </div>
            </ReportSection>
          )}
        </motion.div>
      )}

      {/* Past Reports */}
      {pastReports && pastReports.length > 0 && !report && (
        <Card className="glass-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-3">📜 Relatórios Anteriores</h3>
          <div className="space-y-2">
            {pastReports.slice(0, 5).map((r: any) => (
              <button
                key={r.id}
                onClick={() => setCurrentReport(r.report_json)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-primary text-sm">description</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{r.input_text || r.command || 'Análise'}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <Badge variant="outline" className="text-[9px]">{r.report_type}</Badge>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ReportSection({ title, icon, sectionKey, expanded, onToggle, children }: {
  title: string; icon: React.ReactNode; sectionKey: string; expanded: boolean; onToggle: (k: string) => void; children: React.ReactNode;
}) {
  return (
    <Card className="glass-card overflow-hidden">
      <button onClick={() => onToggle(sectionKey)} className="w-full flex items-center gap-2 p-4 hover:bg-muted/20 transition-colors">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-medium text-foreground flex-1 text-left">{title}</h3>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <CardContent className="px-4 pb-4 pt-0">{children}</CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
