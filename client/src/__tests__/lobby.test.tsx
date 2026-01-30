import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerList from '../components/PlayerList';
import Countdown from '../components/Countdown';
import GameOver from '../components/GameOver';

describe('Lobby - PlayerList', () => {
  const players = [
    { id: '1', username: 'Alice', socketId: 's1' },
    { id: '2', username: 'Bob', socketId: 's2' },
    { id: '3', username: 'Charlie', socketId: 's3' },
  ];

  describe('Given a lobby with three players', () => {
    it('should display all player names', () => {
      render(<PlayerList players={players} hostId="1" />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should display the player count', () => {
      render(<PlayerList players={players} hostId="1" />);

      expect(screen.getByText('Players (3)')).toBeInTheDocument();
    });

    it('should mark the host player', () => {
      render(<PlayerList players={players} hostId="1" />);

      expect(screen.getByText('Host')).toBeInTheDocument();
    });
  });
});

describe('Lobby - Countdown', () => {
  describe('Given the game is about to start', () => {
    it('should show the countdown number', () => {
      render(
        <Countdown
          seconds={3}
          yourAnimal="Cat"
          knownPlayer={{
            playerId: '2',
            username: 'Bob',
            animal: 'Dog',
          }}
        />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display the player\'s assigned animal', () => {
      render(
        <Countdown
          seconds={5}
          yourAnimal="Elephant"
          knownPlayer={{
            playerId: '2',
            username: 'Bob',
            animal: 'Dog',
          }}
        />
      );

      expect(screen.getByText('Elephant')).toBeInTheDocument();
    });

    it('should display the known player\'s animal', () => {
      render(
        <Countdown
          seconds={5}
          yourAnimal="Cat"
          knownPlayer={{
            playerId: '2',
            username: 'Bob',
            animal: 'Dog',
          }}
        />
      );

      expect(screen.getByText('Dog')).toBeInTheDocument();
      expect(screen.getByText(/Bob/)).toBeInTheDocument();
    });
  });
});
