import { render, screen } from '@testing-library/react';
import PaginaCadsAva from './paginasCardsAva';

jest.mock('./carouselAva', () => function MockCarousel({ avaliacoes }) {
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
    jest.clearAllMocks();
});

function renderWithAvaliacoes(avaliacoes) {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => avaliacoes
    });

    render(<PaginaCadsAva />);
}

test('mostra todas as avaliações quando há menos de 15', async () => {
    renderWithAvaliacoes([{ id: 3 }, { id: 2 }, { id: 1 }]);

    expect(await screen.findAllByRole('listitem')).toHaveLength(3);
});

test('limita o carrossel às 15 avaliações mais recentes', async () => {
    const avaliacoes = Array.from({ length: 16 }, (_, index) => ({
        id: 16 - index
    }));

    renderWithAvaliacoes(avaliacoes);

    const cards = await screen.findAllByRole('listitem');
    expect(cards).toHaveLength(15);
    expect(cards[0].textContent).toBe('16');
    expect(cards[14].textContent).toBe('2');
    expect(cards.some((card) => card.textContent === '1')).toBe(false);
});
