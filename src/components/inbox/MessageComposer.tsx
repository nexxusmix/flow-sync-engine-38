import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageComposer({ onSend, disabled, placeholder }: MessageComposerProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Digite sua mensagem..."}
        disabled={disabled}
        className="min-h-[48px] max-h-[120px] resize-none bg-muted/50"
        rows={1}
      />
      <Button 
        type="submit" 
        disabled={!text.trim() || disabled}
        className="btn-primary h-12 w-12 p-0"
      >
        <Send className="w-5 h-5" />
      </Button>
    </form>
  );
}
