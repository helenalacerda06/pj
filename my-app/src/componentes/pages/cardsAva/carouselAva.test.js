import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CarouselAva from './carouselAva';

jest.mock(
    'swiper/react',
    () => ({
        Swiper: ({ children }) => <div>{children}</div>,
        SwiperSlide: ({ children }) => <div>{children}</div>
    }),
    { virtual: true }
);
jest.mock('swiper/css', () => ({}), { virtual: true });
jest.mock('swiper/css/pagination', () => ({}), { virtual: true });
jest.mock(
    'swiper/modules',
    () => ({ Pagination: {}, Keyboard: {} }),
    { virtual: true }
);

const avaliacoes = [
    {
        id: 1,
        nome: 'Filme A',
        imagem: '/filme-a.jpg',
        categoria: 'Filme',
        lancamento: '2024-01-01',
        duracao: '02:00',
        estrelas: 4,
        descricao: 'Descrição do filme A. '.repeat(30),
        feedback: 'Feedback do filme A',
        principais_pontos: 'Pontos do filme A'
    },
    {
        id: 2,
        nome: 'Livro B',
        categoria: 'Livro',
        estrelas: 5,
        descricao: 'Descrição do livro B'
    }
];

test('mostra apenas os detalhes do card selecionado e fecha pelo botão X', async () => {
    render(<CarouselAva avaliacoes={avaliacoes} />);

    fireEvent.click(
        screen.getAllByRole('button', { name: 'Adicionar aos favoritos' })[0]
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Abrir detalhes: Filme A' }));

    const dialog = await screen.findByRole('dialog', { name: 'Filme A' });
    const closeButton = within(dialog).getByRole('button', { name: 'Fechar detalhes' });
    expect(closeButton.querySelector('svg')).toBeInTheDocument();
    expect(closeButton).toHaveClass('detalhesFecharButton');
    expect(within(dialog).getByText('Categoria: Filme')).toBeInTheDocument();
    expect(dialog).toHaveTextContent(avaliacoes[0].descricao);
    expect(within(dialog).getByText('Feedback do filme A')).toBeInTheDocument();
    expect(within(dialog).getByText('Pontos do filme A')).toBeInTheDocument();
    expect(within(dialog).getByRole('img', { name: 'Imagem de Filme A' })).toHaveAttribute(
        'src',
        'https://lacstar-backend.onrender.com/filme-a.jpg'
    );

    fireEvent.click(closeButton);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Abrir detalhes: Livro B' }));

    const outroDialog = await screen.findByRole('dialog', { name: 'Livro B' });
    expect(within(outroDialog).getByText('Descrição do livro B')).toBeInTheDocument();
    expect(outroDialog).not.toHaveTextContent(avaliacoes[0].descricao);
    expect(within(outroDialog).getByText('Feedback')).toBeInTheDocument();
    expect(within(outroDialog).getByText('Principais Pontos')).toBeInTheDocument();
    expect(
        within(outroDialog).queryByRole('img', { name: 'Imagem de Livro B' })
    ).toBeNull();
});

test('abre por teclado, bloqueia os cards ao fundo e restaura o foco ao fechar com Escape', async () => {
    render(<CarouselAva avaliacoes={avaliacoes} />);

    const card = screen.getByRole('button', { name: 'Abrir detalhes: Filme A' });
    card.focus();
    userEvent.keyboard('{Enter}');

    const dialog = await screen.findByRole('dialog', { name: 'Filme A' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(
        screen.queryByRole('button', { name: 'Abrir detalhes: Livro B' })
    ).not.toBeInTheDocument();

    userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(card).toHaveFocus());
});
