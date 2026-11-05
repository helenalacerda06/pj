import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { fazerLogin } from './firebase/auth';

jest.mock('./firebase/auth', () => ({
  fazerLogin: jest.fn(),
  redefinirSenha: jest.fn()
}));
jest.mock('./componentes/pages/inicio/home', () => () => <h1>Início</h1>);
jest.mock('./componentes/pages/minhasAva/minhasAva', () => () => null);

test('renders login and navigates to home after Firebase authentication', async () => {
  fazerLogin.mockResolvedValue({});
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('E-mail'), {
    target: { value: 'user@example.test' }
  });
  fireEvent.change(screen.getByLabelText('Digite sua senha'), {
    target: { value: 'password-for-test' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Logar' }));

  await waitFor(() => {
    expect(fazerLogin).toHaveBeenCalledWith('user@example.test', 'password-for-test');
    expect(screen.getByRole('heading', { name: 'Início' })).toBeInTheDocument();
  });
});
