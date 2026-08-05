import { Component, effect, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  type CreateServicePayload,
  type ServiceRecord,
} from '../../data-access/services-api.service';

@Component({
  selector: 'app-service-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './service-form.component.html',
  styleUrl: './service-form.component.css',
})
export class ServiceFormComponent {
  readonly service = input<ServiceRecord | null>();
  readonly isSubmitting = input<boolean>(false);

  readonly save = output<CreateServicePayload>();
  readonly cancelled = output<void>();

  private readonly fb = new FormBuilder();

  readonly form = this.fb.nonNullable.group({
    slug: ['', [Validators.required, Validators.minLength(3)]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.maxLength(1000)]],
    duration_minutes: [60, [Validators.required, Validators.min(15)]],
    price_amount: ['', [Validators.required, Validators.pattern(/^\d+(\.\d{1,2})?$/)]],
    currency: ['PHP', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
    is_active: [true, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const service = this.service();
      if (service) {
        this.form.patchValue({
          slug: service.slug,
          name: service.name,
          description: service.description ?? '',
          duration_minutes: service.duration_minutes,
          price_amount: service.price_amount,
          currency: service.currency,
          is_active: service.is_active,
        });
      } else {
        this.form.reset({
          slug: '',
          name: '',
          description: '',
          duration_minutes: 60,
          price_amount: '',
          currency: 'PHP',
          is_active: true,
        });
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    this.save.emit({
      ...formValue,
      price_amount: Number(formValue.price_amount).toFixed(2),
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
