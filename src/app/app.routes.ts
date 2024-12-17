import { Routes } from "@angular/router";
import { MainPageComponent } from "./pages/main-page/main-page.component";
import { PlayerComponent } from "./components/player/player.component";
export const routes: Routes = [
  { path: "mainpage", component: MainPageComponent },
  { path: "iframepage", component: PlayerComponent },
  { path: "", redirectTo: "mainpage", pathMatch: "full" },
  { path: "**", redirectTo: "mainpage" },
];
