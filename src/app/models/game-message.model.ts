// models/game-message.model.ts
export interface GameMessage {
  mate?: boolean;
  color?: "white" | "black";
  reset?: boolean;
  move?: string;
}
