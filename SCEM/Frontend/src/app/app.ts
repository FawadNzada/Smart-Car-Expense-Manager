import {
  Component,
  signal
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';

import {
  MenuComponent
} from './menu/menu.component';


@Component({
  selector: 'app-root',

  standalone: true,

  imports: [
    RouterOutlet,
    MenuComponent
  ],

  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  protected readonly pageAnimation =
    signal(true);


  restartPageAnimation(): void {

    this.pageAnimation.set(false);

    requestAnimationFrame(() => {

      requestAnimationFrame(() => {
        this.pageAnimation.set(true);
      });

    });
  }

}