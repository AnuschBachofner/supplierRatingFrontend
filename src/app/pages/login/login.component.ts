import { Component, inject, signal } from '@angular/core';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher.component';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppRoutes } from '../../app.routes.config';
import { ToastComponent } from '../../components/toast/toast.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * Dieser Vertrag beschreibt genau, was wir vom Backend erwarten.
 * Er muss exakt zu deinem Java 'LoginResponseDto' passen.
 */
interface LoginResponse {
  token: string;
  username: string;
}

@Component({
  selector: 'app-login',
  imports: [ThemeSwitcherComponent, FormsModule, ToastComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  /**
   * Angular Router Service
   * @private
   */
  private router = inject(Router);

  /**
   * Angular HttpClient Service
   * @private
   */
  private http = inject(HttpClient); // NEU: HttpClient injizieren

  /**
   * Signals for username and password input fields
   */
  readonly username = signal('');
  readonly password = signal('');

  readonly message = signal<string | null>(null);

  /**
   * Method for handling login
   */
  onLogin() {
    // 1. Wir bereiten das Paket für das Backend vor
    const loginData = {
      username: this.username(),
      password: this.password(),
    };

    // 2. Wir rufen deinen neuen AuthController im Backend auf
    this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, loginData).subscribe({
      next: response => {
        // Wir speichern den Token und den Namen im LocalStorage des Browsers.
        // So "merkt" sich der Browser, dass wir eingeloggt sind.
        localStorage.setItem('openbis_token', response.token);
        localStorage.setItem('username', response.username);
        // Wir leiten den Benutzer zum Dashboard weiter
        this.router.navigate([AppRoutes.BASE, 'dashboard']);
      },
      error: err => {
        // FEHLER: Wenn z.B. das Passwort falsch war oder das Backend nicht läuft.
        this.message.set('Login fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.');
        console.error('Login Error:', err);
      },
    });
  }

  /**
   * Open toast component to display some errors
   * @protected
   */
  protected displayMessage(msg: string) {
    return msg;
  }
}
