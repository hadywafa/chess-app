import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxChessBoardView, NgxChessBoardModule } from "ngx-chess-board";

interface ParentToIframeMessage {
  type: "updateState" | "reset";
  data?: {
    fen?: string;
    turn?: "white" | "black";
    disabled?: boolean;
  };
}

@Component({
  selector: "app-white-player",
  standalone: true,
  imports: [CommonModule, NgxChessBoardModule],
  template: `
    <ngx-chess-board
      #board
      [size]="400"
      [showCoords]="true"
      [dragDisabled]="isDisabled"
      [darkTileColor]="'#d18b47'"
      [lightTileColor]="'#ffce9e'"
      (moveChange)="onMoveChange()"
      (checkmate)="onCheckmate()"
    >
    </ngx-chess-board>
  `,
})
export class WhitePlayerComponent implements OnInit, OnDestroy {
  @ViewChild("board", { static: true }) board!: NgxChessBoardView;
  isDisabled = false;
  private messageListener!: (event: MessageEvent) => void;

  ngOnInit() {
    this.messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data as ParentToIframeMessage;
      this.handleParentMessage(msg);
    };
    window.addEventListener("message", this.messageListener);

    const requestMsg = { type: "requestState" };
    window.parent.postMessage(requestMsg, window.location.origin);
  }

  ngOnDestroy(): void {
    window.removeEventListener("message", this.messageListener);
  }

  handleParentMessage(msg: ParentToIframeMessage) {
    if (msg.type === "updateState" && msg.data) {
      if (msg.data.fen && msg.data.fen !== this.board.getFEN()) {
        this.board.setFEN(msg.data.fen);
      }
      if (typeof msg.data.disabled === "boolean") {
        this.isDisabled = msg.data.disabled;
      }
    } else if (msg.type === "reset") {
      this.board.reset();
    }
  }

  onMoveChange() {
    const fen = this.board.getFEN();
    const msg = { type: "move", data: { fen } };
    window.parent.postMessage(msg, window.location.origin);
  }

  onCheckmate() {
    const msg = { type: "checkmate" };
    window.parent.postMessage(msg, window.location.origin);
  }
}
