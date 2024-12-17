import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

interface IframeToParentMessage {
  type: "move" | "checkmate" | "requestState";
  data?: { fen?: string };
}

interface ParentToIframeMessage {
  type: "updateState" | "reset";
  data?: {
    fen?: string;
    turn?: "white" | "black";
    disabled?: boolean;
  };
}

@Component({
  selector: "app-main-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1>Main page</h1>
    <button (click)="createNewGame()">Create New Game</button>
    <div style="display:flex; gap:20px;">
      <div style="border:1px solid #000; background: #ffe0b2;">
        <h3>Iframe 1 (White)</h3>
        <iframe #iframe1 [src]="iframeSrc" width="400" height="400"></iframe>
      </div>
      <div style="border:1px solid #000; background: #e0d4f3;">
        <h3>Iframe 2 (Black)</h3>
        <iframe #iframe2 [src]="iframeSrc" width="400" height="400"></iframe>
      </div>
    </div>
  `,
})
export class MainPageComponent implements OnInit, OnDestroy {
  @ViewChild("iframe1", { static: true }) iframe1!: ElementRef<HTMLIFrameElement>;
  @ViewChild("iframe2", { static: true }) iframe2!: ElementRef<HTMLIFrameElement>;

  iframeSrc: SafeResourceUrl;
  currentFen: string = "start";
  currentTurn: "white" | "black" = "white";
  private messageListener!: (event: MessageEvent) => void;

  constructor(private sanitizer: DomSanitizer) {
    // Use the sanitizer to mark the URL as safe
    this.iframeSrc = this.sanitizer.bypassSecurityTrustResourceUrl("/iframepage");
  }
  ngOnInit() {
    const savedState = localStorage.getItem("chessGameState");
    if (savedState) {
      const state = JSON.parse(savedState);
      this.currentFen = state.fen || "start";
      this.currentTurn = state.turn || "white";
    }

    this.messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const message = event.data as IframeToParentMessage;
      this.handleIframeMessage(message);
    };

    window.addEventListener("message", this.messageListener);

    setTimeout(() => {
      this.syncStateToIframes();
    }, 500);
  }

  ngOnDestroy(): void {
    window.removeEventListener("message", this.messageListener);
  }

  handleIframeMessage(message: IframeToParentMessage) {
    if (message.type === "move") {
      this.currentFen = message.data?.fen || this.currentFen;
      this.currentTurn = this.currentTurn === "white" ? "black" : "white";
      this.saveState();
      this.syncStateToIframes();
    } else if (message.type === "checkmate") {
      alert("Checkmate! Game Over.");
    } else if (message.type === "requestState") {
      this.syncStateToIframes();
    }
  }

  syncStateToIframes() {
    const iframe1Win = this.iframe1.nativeElement.contentWindow!;
    const iframe2Win = this.iframe2.nativeElement.contentWindow!;

    const msg1: ParentToIframeMessage = {
      type: "updateState",
      data: {
        fen: this.currentFen,
        turn: this.currentTurn,
        disabled: this.currentTurn !== "white",
      },
    };
    iframe1Win.postMessage(msg1, window.location.origin);

    const msg2: ParentToIframeMessage = {
      type: "updateState",
      data: {
        fen: this.currentFen,
        turn: this.currentTurn,
        disabled: this.currentTurn !== "black",
      },
    };
    iframe2Win.postMessage(msg2, window.location.origin);
  }

  saveState() {
    const state = {
      fen: this.currentFen,
      turn: this.currentTurn,
    };
    localStorage.setItem("chessGameState", JSON.stringify(state));
  }

  createNewGame() {
    this.currentFen = "start";
    this.currentTurn = "white";
    this.saveState();
    this.syncStateToIframes();
  }
}
