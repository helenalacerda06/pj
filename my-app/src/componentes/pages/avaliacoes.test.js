import { fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CriarAvaliacao from './criarAvaliacao/criarAvaliacao';
import { apiRequest } from '../../services/api';

jest.mock('../Header', () => () => null);
jest.mock('../Footer', () => () => null);
jest.mock('../button/buttonVoltar', () => () => null);
jest.mock('../../services/api', () => ({ apiRequest: jest.fn() }));

test('creates an evaluation using the authenticated API without client-supplied ownership', async () => {
    apiRequest.mockResolvedValue({
        id: 'review-a',
        imagemUrl: null
    });
    const { container } = render(
        <MemoryRouter>
            <CriarAvaliacao />
        </MemoryRouter>
    );

    fireEvent.change(container.querySelector('select'), {
        target: { value: 'Filme' }
    });
    fireEvent.change(container.querySelector('#nomeAvaliacao'), {
        target: { value: 'Obra de teste' }
    });
    fireEvent.submit(container.querySelector('form'));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(1));
    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe('/avaliacao');
    expect(options.method).toBe('POST');
    expect(options.body.get('categoria')).toBe('Filme');
    expect(options.body.get('nome')).toBe('Obra de teste');
    expect(options.body.get('usuarioUid')).toBeNull();
    expect(options.body.get('id_usuario')).toBeNull();
});

test('shows an explicit error when evaluation persistence fails', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    apiRequest.mockRejectedValue(new Error('Firestore unavailable'));
    const { container } = render(
        <MemoryRouter>
            <CriarAvaliacao />
        </MemoryRouter>
    );

    fireEvent.submit(container.querySelector('form'));

    try {
        await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Firestore unavailable'));
    } finally {
        alertSpy.mockRestore();
        errorSpy.mockRestore();
    }
});
