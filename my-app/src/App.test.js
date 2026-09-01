import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';

test('renderiza login e navega para criar avaliação', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AppRoutes />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^login$/i }));

  expect(screen.getByRole('heading', { name: /criar nova avaliação/i })).toBeInTheDocument();
});
