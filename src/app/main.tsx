import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { appStarted } from '@/entities/viewer';
import { Toaster } from '@/shared/ui/sonner';
import { AppRouter } from './routing/router';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Не найден элемент #root');

appStarted();

createRoot(root).render(
  <StrictMode>
    <AppRouter />
    <Toaster position="top-center" richColors={false} />
  </StrictMode>,
);
