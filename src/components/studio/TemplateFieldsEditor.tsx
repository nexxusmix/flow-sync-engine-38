import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import type { TemplateField } from '@/lib/figma-community-templates';

interface TemplateFieldsEditorProps {
  fields: TemplateField[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  disabled?: boolean;
}

export function TemplateFieldsEditor({ fields, values, onChange, disabled }: TemplateFieldsEditorProps) {
  const update = (key: string, value: string) => {
    onChange({ ...values, ...{ [key]: value } });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium text-foreground">Campos do Template</h3>
      </div>

      <div className="space-y-2.5">
        {fields.map(field => (
          <div key={field.key} className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">{field.label}</Label>
            {field.type === 'textarea' ? (
              <Textarea
                value={values[field.key] || ''}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="text-xs resize-none"
                disabled={disabled}
              />
            ) : (
              <Input
                value={values[field.key] || ''}
                onChange={(e) => update(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="h-8 text-xs"
                disabled={disabled}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
