import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface GameState {
  fen: string;
  turn: 'white' | 'black';
}

@Injectable({
  providedIn: 'root',
})
export class ChessService {
  private gameStateSubject = new BehaviorSubject<GameState>({
    fen: 'start',
    turn: 'white',
  });

  gameState$ = this.gameStateSubject.asObservable();

  constructor() {
    this.loadState();
  }

  updateState(fen: string, turn: 'white' | 'black') {
    const newState: GameState = { fen, turn };
    this.gameStateSubject.next(newState);
    this.saveState(newState);
  }

  resetState() {
    const initialState: GameState = { fen: 'start', turn: 'white' };
    this.gameStateSubject.next(initialState);
    this.saveState(initialState);
  }

  private saveState(state: GameState) {
    localStorage.setItem('chessGameState', JSON.stringify(state));
  }

  private loadState() {
    const savedState = localStorage.getItem('chessGameState');
    if (savedState) {
      try {
        const state: GameState = JSON.parse(savedState);
        this.gameStateSubject.next(state);
      } catch {
        this.resetState();
      }
    }
  }
}
