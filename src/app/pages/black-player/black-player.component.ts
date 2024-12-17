import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxChessBoardView, NgxChessBoardModule } from "ngx-chess-board";

interface ParentToIframeMessage {
  type: "updateState" | "reset";
  data?: {
    fen?: string;
    turn?: "white" | "black";
  };
}

@Component({
  selector: "app-black-player",
  standalone: true,
  imports: [CommonModule, NgxChessBoardModule],
  template: `
    <ngx-chess-board
      #board
      [size]="400"
      [showCoords]="true"
      [darkTileColor]="'#d18b47'"
      [lightTileColor]="'#ffce9e'"
      [lightDisabled]="true"
      (moveChange)="onMoveChange()"
      (checkmate)="onCheckmate()"
    ></ngx-chess-board>
  `,
})
export class BlackPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("board", { static: true }) board!: NgxChessBoardView;
  lightDisabled = true; // Initially disable white since black is reversed side
  darkDisabled = false; // If you start as white's turn, you can adjust these defaults as needed
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

  ngAfterViewInit(): void {
    // Reverse once for black perspective
    setTimeout(() => {
      this.board.reverse();
    }, 100);
  }

  ngOnDestroy(): void {
    window.removeEventListener("message", this.messageListener);
  }

  handleParentMessage(msg: ParentToIframeMessage) {
    if (msg.type === "updateState" && msg.data) {
      if (msg.data.fen && msg.data.fen !== this.board.getFEN()) {
        this.board.setFEN(msg.data.fen);
      }

      if (msg.data.turn) {
        // On white turn: whiteEnabled = true (lightDisabled=false), blackEnabled = false (darkDisabled=true)
        // On black turn: blackEnabled = true (darkDisabled=false), whiteDisabled=true (lightDisabled=true)
        if (msg.data.turn === "white") {
          this.lightDisabled = false;
          this.darkDisabled = true;
        } else {
          this.lightDisabled = true;
          this.darkDisabled = false;
        }
      }
    } else if (msg.type === "reset") {
      this.board.reset();
      setTimeout(() => {
        this.board.reverse();
      }, 50);
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
