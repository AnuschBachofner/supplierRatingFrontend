import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  imports: [LucideAngularModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  /**
   * Lucide Icon
   * @protected
   */
  protected readonly X = X;

  // Input: Properties for the toast component. The message to be displayed in the toast. Default is null (no message).
  readonly message = input<string | null>(null);
  // Input: Properties for the toast component. Default type is 'error'.
  readonly type = input<'error' | 'success'>('error');
  readonly exitToast = output<void>();

  onClose() {
    this.exitToast.emit();
  }
}
