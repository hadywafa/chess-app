import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

interface IframeToParentMessage {
  type: "move" | "checkmate" | "requestState";
  data?: {
    fen?: string;
  };
}

interface ParentToIframeMessage {
  type: "updateState" | "reset";
  data?: {
    fen?: string;
    turn?: "white" | "black";
  };
}

@Component({
  selector: "app-main-page",
  template: `
    <h1>Main page</h1>
    <button (click)="createNewGame()">Create New Game</button>
    <div style="display:flex; gap:20px;">
      <div style="border:1px solid #000; background: #ffe0b2;">
        <h3>Iframe 1 (White)</h3>
        <iframe #iframeWhite [src]="iframeWhiteSrc" width="400" height="400"></iframe>
      </div>
      <div style="border:1px solid #000; background: #e0d4f3;">
        <h3>Iframe 2 (Black)</h3>
        <iframe #iframeBlack [src]="iframeBlackSrc" width="400" height="400"></iframe>
      </div>
    </div>
  `,
})
export class MainPageComponent implements OnInit, OnDestroy {
  @ViewChild("iframeWhite", { static: true }) iframeWhite!: ElementRef<HTMLIFrameElement>;
  @ViewChild("iframeBlack", { static: true }) iframeBlack!: ElementRef<HTMLIFrameElement>;

  iframeWhiteSrc: SafeResourceUrl;
  iframeBlackSrc: SafeResourceUrl;

  currentFen: string = "start";
  currentTurn: "white" | "black" = "white";
  private messageListener!: (event: MessageEvent) => void;

  constructor(private sanitizer: DomSanitizer) {
    // Assign iframe paths; adjust as needed based on your routing
    this.iframeWhiteSrc = this.sanitizer.bypassSecurityTrustResourceUrl("/iframepagewhite");
    this.iframeBlackSrc = this.sanitizer.bypassSecurityTrustResourceUrl("/iframepageblack");
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
    const iframeWhiteWin = this.iframeWhite.nativeElement.contentWindow!;
    const iframeBlackWin = this.iframeBlack.nativeElement.contentWindow!;

    const msgWhite: ParentToIframeMessage = {
      type: "updateState",
      data: {
        fen: this.currentFen,
        turn: this.currentTurn,
      },
    };
    iframeWhiteWin.postMessage(msgWhite, window.location.origin);

    const msgBlack: ParentToIframeMessage = {
      type: "updateState",
      data: {
        fen: this.currentFen,
        turn: this.currentTurn,
      },
    };
    iframeBlackWin.postMessage(msgBlack, window.location.origin);
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
