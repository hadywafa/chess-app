import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { NgIf } from "@angular/common";
import { Subscription } from "rxjs";
import { GameMessage } from "src/app/models/game-message.model";
import { CommunicationService } from "src/app/services/communication.service";
import { StorageService } from "src/app/services/storage.service";
import { IFRAME_PATH } from "src/app/utils/constants";

@Component({
  selector: "app-main-page",
  templateUrl: "./main-page.component.html",
  styleUrls: ["./main-page.component.css"],
  standalone: true,
  imports: [NgIf],
})
export class MainPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("white_board_iframe") whiteBoardIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild("black_board_iframe") blackBoardIframe!: ElementRef<HTMLIFrameElement>;

  gameFinished = false;
  iFrameWhiteBoardUrl: SafeResourceUrl;
  iFrameBlackBoardUrl: SafeResourceUrl;
  private messageSubscription!: Subscription;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private communicationService: CommunicationService,
    private storageService: StorageService
  ) {
    this.iFrameWhiteBoardUrl = this.getIframePageUrl(true);
    this.iFrameBlackBoardUrl = this.getIframePageUrl();
  }

  ngOnInit(): void {
    this.messageSubscription = this.communicationService.messages$.subscribe((message: GameMessage) => {
      if (message.mate) {
        this.gameFinished = true;
      }

      const lastTurnColor = message.color;

      if (lastTurnColor) {
        const targetIframe = lastTurnColor === "white" ? this.blackBoardIframe : this.whiteBoardIframe;
        const targetWindow = targetIframe.nativeElement.contentWindow;

        this.communicationService.sendMessage(targetWindow, message, this.getIframeOrigin());
      }
    });
  }

  ngAfterViewInit(): void {
    // Additional initialization if needed after view is loaded
  }

  onGameEnd(): void {
    this.gameFinished = true;
  }

  reset(): void {
    this.gameFinished = false;

    const resetData: GameMessage = { reset: true };

    this.communicationService.sendMessage(
      this.whiteBoardIframe.nativeElement.contentWindow,
      resetData,
      this.getIframeOrigin()
    );

    this.communicationService.sendMessage(
      this.blackBoardIframe.nativeElement.contentWindow,
      resetData,
      this.getIframeOrigin()
    );

    this.storageService.clear();
  }

  private getIframePageUrl(isWhite: boolean = false): SafeResourceUrl {
    const baseUrl = `${window.location.origin}${IFRAME_PATH}`;
    const url = isWhite ? `${baseUrl}/?isWhite=true` : baseUrl;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  private getIframeOrigin(): string {
    return window.location.origin;
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }
}
