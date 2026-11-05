import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import MinhasAva from './minhasAva';
import { apiRequest } from '../../../services/api';
import { observarAutenticacao } from '../../../firebase/auth';

jest.mock('../../Header', () => () => null);
jest.mock('../../Footer', () => () => null);
jest.mock('../cardsAva/carouselAva', () => function MockCarousel({ avaliacoes }) {
    const { createElement } = require('react');
    return createElement(
        'ol',
        null,
        avaliacoes.map(({ id }) =>
            createElement('li', { key: id }, String(id))
        )
    );
});
jest.mock('../../../services/api', () => ({ apiRequest: jest.fn() }));
jest.mock('../../../firebase/auth', () => ({ observarAutenticacao: jest.fn() }));

let authCallback;

beforeEach(() => {
    authCallback = null;
    observarAutenticacao.mockImplementation((callback) => {
        authCallback = callback;
        return jest.fn();
    });
});

afterEach(() => {
    jest.clearAllMocks();
});

async function renderWithUser(reviews) {
    apiRequest.mockResolvedValue(reviews);
    render(<MinhasAva />);
    await act(async () => authCallback({ uid: 'uid-a' }));
}

test('loads only authenticated user reviews', async () => {
    await renderWithUser([{ id: 'review-a' }, { id: 'review-b' }]);

    expect(await screen.findAllByRole('listitem')).toHaveLength(2);
    expect(apiRequest).toHaveBeenCalledWith('/avaliacoes_usuario');
});

test('limits the personal carousel to the 15 most recent reviews', async () => {
    await renderWithUser(Array.from({ length: 16 }, (_, index) => ({
        id: `review-${16 - index}`
    })));

    const cards = await screen.findAllByRole('listitem');
    expect(cards).toHaveLength(15);
    expect(cards[0].textContent).toBe('review-16');
    expect(cards[14].textContent).toBe('review-2');
});

test('shows an empty state when the authenticated user has no reviews', async () => {
    await renderWithUser([]);

    expect(
        await screen.findByText('Você ainda não possui avaliações cadastradas.')
    ).toBeInTheDocument();
});

test('does not request personal reviews without an authenticated user', async () => {
    render(<MinhasAva />);
    await act(async () => authCallback(null));

    expect(await screen.findByRole('alert')).toHaveTextContent(
        'Entre na sua conta para ver suas avaliações.'
    );
    expect(apiRequest).not.toHaveBeenCalled();
});
