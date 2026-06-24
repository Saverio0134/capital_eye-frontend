import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, LandmarkIcon } from 'lucide-angular';

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet, LucideAngularModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export default class Auth {
  readonly LandmarkIcon = LandmarkIcon
}
