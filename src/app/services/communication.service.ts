import { Injectable, OnDestroy } from "@angular/core";
import { Subject, fromEvent, Subscription } from "rxjs";
import { GameMessage } from "../models/game-message.model";

@Injectable({
  providedIn: "root",
})
export class CommunicationService implements OnDestroy {
  private messageSubject = new Subject<GameMessage>();
  private subscription: Subscription;

  constructor() {
    this.subscription = fromEvent<MessageEvent>(window, "message").subscribe((event) => {
      if (event.data) {
        console.log("Received message:", event.data);
        this.messageSubject.next(event.data as GameMessage);
      }
    });
  }

  sendMessage(targetWindow: Window | null, message: GameMessage, targetOrigin: string): void {
    if (targetWindow) {
      console.log("Sending message:", message, "to", targetOrigin);
      targetWindow.postMessage(message, targetOrigin);
    }
  }

  get messages$() {
    return this.messageSubject.asObservable();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
