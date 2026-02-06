import { useState, useEffect } from 'react';
import { useContentMetrics, MetricsInput } from '@/hooks/useContentMetrics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, MessageCircle, Share2, Eye, Users, 
  Save, Loader2, Info, TrendingUp, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContentMetricsSectionProps {
  contentItemId: string;
  isPublished: boolean;
}

export function ContentMetricsSection({ contentItemId, isPublished }: ContentMetricsSectionProps) {
  const { metrics, history, isLoading, isSaving, saveMetrics } = useContentMetrics(contentItemId);
  
  const [formData, setFormData] = useState<MetricsInput>({
    likes: 0,
    comments: 0,
    shares: 0,
    reach: 0,
    views: 0,
  });

  useEffect(() => {
    if (metrics) {
      setFormData({
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
        reach: metrics.reach || 0,
        views: metrics.views || 0,
      });
    }
  }, [metrics]);

  const handleSave = async () => {
    await saveMetrics(formData);
  };

  const handleInputChange = (field: keyof MetricsInput, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
  };

  if (!isPublished) {
    return (
      <Card className="p-6 bg-muted/30">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Info className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Métricas disponíveis após publicação</p>
            <p className="text-xs">Quando o conteúdo for publicado, você poderá registrar as métricas de performance aqui.</p>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  const engagement = (formData.likes || 0) + (formData.comments || 0);
  const engagementRate = formData.reach && formData.reach > 0 
    ? ((engagement / formData.reach) * 100).toFixed(2) 
    : '0.00';

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Métricas de Performance
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Insira manualmente os dados de performance do post
          </p>
        </div>
        <Badge variant="outline" className="text-[10px]">
          <Info className="w-3 h-3 mr-1" />
          Entrada manual
        </Badge>
      </div>

      {/* Metrics Form */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricInput
          icon={Heart}
          label="Curtidas"
          value={formData.likes || 0}
          onChange={(v) => handleInputChange('likes', v)}
          color="text-red-500"
        />
        <MetricInput
          icon={MessageCircle}
          label="Comentários"
          value={formData.comments || 0}
          onChange={(v) => handleInputChange('comments', v)}
          color="text-blue-500"
        />
        <MetricInput
          icon={Share2}
          label="Compartilhamentos"
          value={formData.shares || 0}
          onChange={(v) => handleInputChange('shares', v)}
          color="text-green-500"
        />
        <MetricInput
          icon={Users}
          label="Alcance"
          value={formData.reach || 0}
          onChange={(v) => handleInputChange('reach', v)}
          color="text-purple-500"
        />
        <MetricInput
          icon={Eye}
          label="Visualizações"
          value={formData.views || 0}
          onChange={(v) => handleInputChange('views', v)}
          color="text-cyan-500"
        />
      </div>

      {/* Calculated Stats */}
      <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30">
        <div>
          <p className="text-xs text-muted-foreground">Engajamento Total</p>
          <p className="text-lg font-semibold text-foreground">{engagement.toLocaleString('pt-BR')}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Taxa de Engajamento</p>
          <p className="text-lg font-semibold text-foreground">{engagementRate}%</p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {metrics?.collected_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Última atualização: {format(new Date(metrics.collected_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          )}
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Salvar Métricas
        </Button>
      </div>

      {/* History (collapsed by default) */}
      {history.length > 1 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Ver histórico ({history.length} registros)
          </summary>
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {history.map((h, idx) => (
              <div key={h.id} className="flex items-center justify-between p-2 rounded bg-muted/20">
                <span className="text-muted-foreground">
                  {format(new Date(h.collected_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-500" /> {h.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-blue-500" /> {h.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-purple-500" /> {h.reach}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </Card>
  );
}

interface MetricInputProps {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (value: string) => void;
  color: string;
}

function MetricInput({ icon: Icon, label, value, onChange, color }: MetricInputProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs flex items-center gap-1">
        <Icon className={cn("w-3 h-3", color)} />
        {label}
      </Label>
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
    </div>
  );
}
