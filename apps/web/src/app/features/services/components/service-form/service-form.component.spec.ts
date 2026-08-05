import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceFormComponent } from './service-form.component';

describe('ServiceFormComponent', () => {
  let component: ServiceFormComponent;
  let fixture: ComponentFixture<ServiceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('is invalid by default', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('emits create payload when submitting valid new service form', () => {
    const emitSpy = vi.spyOn(component.save, 'emit');

    component.form.setValue({
      slug: 'initial-consult',
      name: 'Initial Consultation',
      description: 'Intro session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
    });

    component.submit();

    expect(emitSpy).toHaveBeenCalledWith({
      slug: 'initial-consult',
      name: 'Initial Consultation',
      description: 'Intro session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
    });
  });

  it('formats price_amount with two decimal places when submitting', () => {
    const emitSpy = vi.spyOn(component.save, 'emit');

    component.form.setValue({
      slug: 'initial-consult',
      name: 'Initial Consultation',
      description: 'Intro session',
      duration_minutes: 60,
      price_amount: '2500',
      currency: 'PHP',
      is_active: true,
    });

    component.submit();

    expect(emitSpy).toHaveBeenCalledWith({
      slug: 'initial-consult',
      name: 'Initial Consultation',
      description: 'Intro session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
    });
  });

  it('patches form when edit values are provided', () => {
    fixture.componentRef.setInput('service', {
      id: 'svc-1',
      slug: 'initial-consult',
      name: 'Initial Consultation',
      description: 'Intro session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    });
    fixture.detectChanges();

    expect(component.form.getRawValue()).toEqual({
      slug: 'initial-consult',
      name: 'Initial Consultation',
      description: 'Intro session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: false,
    });
  });

  it('emits cancel event when cancel button is clicked', () => {
    const emitSpy = vi.spyOn(component.cancelled, 'emit');

    component.onCancel();

    expect(emitSpy).toHaveBeenCalled();
  });
});
