import { Link } from 'react-router';
import { routes } from '@/shared/config';
import { Button } from '@/shared/ui/button';
import { EmptyState } from '@/shared/ui/state';

export const NotFoundPage = () => (
  <EmptyState
    title="Страница не найдена"
    description="Проверьте адрес или вернитесь на главную."
    action={
      <Button variant="outline" asChild>
        <Link to={routes.root}>На главную</Link>
      </Button>
    }
  />
);
