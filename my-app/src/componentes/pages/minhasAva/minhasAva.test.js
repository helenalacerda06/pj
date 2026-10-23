import { render, screen } from '@testing-library/react';
import MinhasAva from './minhasAva';

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

const fetchOriginal = global.fetch;

afterEach(() => {
    global.fetch = fetchOriginal;
    localStorage.clear();
    jest.clearAllMocks();
});

test('carrega apenas as avaliações do usuário identificado', async () => {
    localStorage.setItem('id_usuario', '42');
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 8 }, { id: 3 }]
    });

    render(<MinhasAva />);

    expect(await screen.findAllByRole('listitem')).toHaveLength(2);
    expect(global.fetch).toHaveBeenCalledWith(
        'https://lacstar-backend.onrender.com/avaliacoes_usuarios/42'
    );
});

test('limita o carrossel pessoal às 15 avaliações mais recentes', async () => {
    localStorage.setItem('id_usuario', '42');
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => Array.from({ length: 16 }, (_, index) => ({
            id: 16 - index
        }))
    });

    render(<MinhasAva />);

    const cards = await screen.findAllByRole('listitem');
    expect(cards).toHaveLength(15);
    expect(cards[0].textContent).toBe('16');
    expect(cards[14].textContent).toBe('2');
    expect(cards.some((card) => card.textContent === '1')).toBe(false);
});

test('mostra o estado vazio quando o usuário não tem avaliações', async () => {
    localStorage.setItem('id_usuario', '42');
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => []
    });

    render(<MinhasAva />);

    expect(
        await screen.findByText('Você ainda não possui avaliações cadastradas.')
    ).toBeTruthy();
});

test('informa quando não há usuário identificado e não consulta a API', async () => {
    global.fetch = jest.fn();

    render(<MinhasAva />);

    expect(
        (await screen.findByRole('alert')).textContent
    ).toBe('Nenhum usuário está identificado.');
    expect(global.fetch).not.toHaveBeenCalled();
});
