import { useUnit } from 'effector-react';
import { SendHorizontalIcon } from 'lucide-react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { $draft, addCommentMutation, draftChanged, submitted } from '../model/comment';

type Props = { taskId: string };

export const CommentForm = ({ taskId }: Props) => {
  const [draft, pending, onChange, onSubmit] = useUnit([
    $draft,
    addCommentMutation.$pending,
    draftChanged,
    submitted,
  ]);

  const send = () => onSubmit({ taskId });
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };
  // Ctrl/Cmd + Enter — отправить (на телефоне Enter переносит строку).
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      send();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Textarea
        aria-label="Сообщение"
        placeholder="Написать сообщение"
        rows={1}
        maxLength={4000}
        className="max-h-40 min-h-11 resize-none text-base md:text-sm"
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button
        type="submit"
        size="icon"
        className="size-11 shrink-0"
        disabled={pending || draft.trim().length === 0}
        aria-label="Отправить"
      >
        <SendHorizontalIcon className="size-[18px]" strokeWidth={1.75} />
      </Button>
    </form>
  );
};
