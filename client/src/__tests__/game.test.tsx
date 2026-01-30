import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import GameOver from '../components/GameOver';
import ColorPalette from '../components/ColorPalette';
import MiniCanvas from '../components/MiniCanvas';

describe('Game - GameOver', () => {
  const baseResult = {
    winnerId: '1',
    winReason: 'last_standing' as const,
    players: [
      { id: '1', username: 'Alice', animal: 'Cat', isEliminated: false },
      { id: '2', username: 'Bob', animal: 'Dog', isEliminated: true },
      { id: '3', username: 'Charlie', animal: 'Bear', isEliminated: true },
    ],
  };

  describe('Given the current player won', () => {
    it('should display Victory', () => {
      render(<GameOver result={baseResult} currentUserId="1" />);
      expect(screen.getByText('Victory!')).toBeInTheDocument();
    });

    it('should show the correct win reason for last standing', () => {
      render(<GameOver result={baseResult} currentUserId="1" />);
      expect(
        screen.getByText('You were the last player standing!')
      ).toBeInTheDocument();
    });

    it('should show the correct win reason for guessing all', () => {
      const result = { ...baseResult, winReason: 'guessed_all' as const };
      render(<GameOver result={result} currentUserId="1" />);
      expect(
        screen.getByText("You guessed all other players' animals!")
      ).toBeInTheDocument();
    });
  });

  describe('Given the current player lost', () => {
    it('should display Defeat', () => {
      render(<GameOver result={baseResult} currentUserId="2" />);
      expect(screen.getByText('Defeat')).toBeInTheDocument();
    });

    it('should show who won', () => {
      render(<GameOver result={baseResult} currentUserId="2" />);
      expect(screen.getByText(/Alice won the game/)).toBeInTheDocument();
    });
  });

  describe('Given the game has ended', () => {
    it('should reveal all animals in standings', () => {
      render(<GameOver result={baseResult} currentUserId="1" />);
      expect(screen.getByText('Cat')).toBeInTheDocument();
      expect(screen.getByText('Dog')).toBeInTheDocument();
      expect(screen.getByText('Bear')).toBeInTheDocument();
    });
  });
});

describe('Game - ColorPalette', () => {
  const noop = () => {};

  describe('Given the color palette is rendered', () => {
    it('should render all color swatches', () => {
      render(
        <ColorPalette
          color="#000000"
          onColorChange={noop}
          lineWidth={3}
          onLineWidthChange={noop}
          onClear={noop}
        />
      );
      // 12 color buttons + 4 width buttons + 1 clear button
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(12);
    });

    it('should render the clear button', () => {
      render(
        <ColorPalette
          color="#000000"
          onColorChange={noop}
          lineWidth={3}
          onLineWidthChange={noop}
          onClear={noop}
        />
      );
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });
});

describe('Game - MiniCanvas', () => {
  describe('Given a player who is eliminated', () => {
    it('should show OUT indicator', () => {
      render(
        <MiniCanvas
          playerId="1"
          username="Alice"
          eliminated={true}
          strokes={[]}
        />
      );
      expect(screen.getByText('OUT')).toBeInTheDocument();
    });

    it('should display the player username', () => {
      render(
        <MiniCanvas
          playerId="1"
          username="Alice"
          eliminated={false}
          strokes={[]}
        />
      );
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });
  });
});
