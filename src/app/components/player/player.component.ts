import { Component, Input, ViewChild, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { NgxChessBoardView, NgxChessBoardModule } from "ngx-chess-board";
import { ActivatedRoute } from "@angular/router";
import { HistoryMove } from "ngx-chess-board/lib/history-move-provider/history-move";
import { Subscription } from "rxjs";
import { GameMessage } from "src/app/models/game-message.model";
import { CommunicationService } from "src/app/services/communication.service";
import { StorageService } from "src/app/services/storage.service";

@Component({
  selector: "app-player",
  templateUrl: "./player.component.html",
  styleUrls: ["./player.component.css"],
  standalone: true,
  imports: [NgxChessBoardModule],
})
export class PlayerComponent implements OnInit, AfterViewInit, OnDestroy {
  isWhiteBoard = false;
  playerColor: "white" | "black" = "white";
  lightTileColor = "#EEEED2";
  darkTileColor = "#769656";

  @Input() onGameEnd!: () => void;
  @ViewChild("board", { static: false }) board!: NgxChessBoardView;

  private messageSubscription!: Subscription;

  constructor(
    private route: ActivatedRoute,
    private communicationService: CommunicationService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.isWhiteBoard = params["isWhite"] === "true";
      this.playerColor = this.isWhiteBoard ? "white" : "black";
    });

    this.messageSubscription = this.communicationService.messages$.subscribe((message: GameMessage) => {
      if (message.reset) {
        this.handleResetEvent();
      } else if (message.move) {
        this.handleMoveEvent(message);
      }

      if (message.mate) {
        this.onGameEnd();
      }
    });
  }

  ngAfterViewInit(): void {
    const currBoardState = this.storageService.getItem("board");
    if (currBoardState) {
      this.board.setFEN(currBoardState);
    }

    if (!this.isWhiteBoard) {
      setTimeout(() => {
        this.board.reverse();
      }, 0);
    }
  }

  onMove(): void {
    const lastMove: HistoryMove | undefined = this.board.getMoveHistory().slice(-1)[0];
    if (lastMove) {
      const moveData: GameMessage = { move: lastMove.move, color: this.playerColor };
      this.communicationService.sendMessage(window.parent, moveData, this.getMainPageOrigin());
    }
  }

  private handleResetEvent(): void {
    this.board.reset();

    if (!this.isWhiteBoard) {
      this.board.reverse();
    }

    this.storageService.clear();
  }

  private handleMoveEvent(message: GameMessage): void {
    if (message.move) {
      this.board.move(message.move);
      this.storageService.setItem("board", this.board.getFEN());
    }
  }

  private getMainPageOrigin(): string {
    return window.location.origin;
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
