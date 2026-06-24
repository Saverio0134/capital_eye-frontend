import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import Navigation from '../../core/navigation/navigation';

@Component({
  selector: 'app-logged-layout',
  imports: [Navigation, RouterOutlet],
  templateUrl: './logged-layout.html',
  styleUrl: './logged-layout.css',
})
export default class LoggedLayout {}
