import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
    selector: 'app-auth-layout',
    imports: [RouterOutlet],
    template: `
    <div class="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-12">
      <div class="w-full max-w-md">
        <div class="mb-8 flex items-center justify-center gap-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-500 text-lg font-bold text-white">
            V
          </div>
          <span class="font-display text-2xl font-semibold text-white">VoiceMed Pro</span>
        </div>
        <div class="card p-8">
          <router-outlet />
        </div>
      </div>
    </div>
  `
})
export class AuthLayoutComponent {}
