import { Routes } from "@angular/router";
import { MainPageComponent } from "./pages/main-page/main-page.component";
import { WhitePlayerComponent } from "./pages/white-player/white-player.component";
import { BlackPlayerComponent } from "./pages/black-player/black-player.component";
export const routes: Routes = [
  { path: "mainpage", component: MainPageComponent },
  { path: "iframepagewhite", component: WhitePlayerComponent },
  { path: "iframepageblack", component: BlackPlayerComponent },
  { path: "", redirectTo: "mainpage", pathMatch: "full" },
];
