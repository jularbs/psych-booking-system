import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServicesManageComponent } from './services-manage.component';
import { ServiceFormComponent } from '../../components/service-form/service-form.component';
import { ServicesManagePageStore } from './services-manage-page.store';

describe('ServicesManageComponent', () => {
  let fixture: ComponentFixture<ServicesManageComponent>;
  let component: ServicesManageComponent;
  const sampleRecords = [
    {
      id: 'svc-1',
      slug: 'initial-consult',
      name: 'Initial Consultation',
      description: 'Intro session',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
      created_at: '2026-07-24T00:00:00.000Z',
      updated_at: '2026-07-24T00:00:00.000Z',
    },
  ];

  const store = {
    load: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deactivate: vi.fn(),
    reactivate: vi.fn(),
    setFilter: vi.fn(),
    startEditing: vi.fn(),
    stopEditing: vi.fn(),
    editingService: vi.fn(),
    services: vi.fn(() => sampleRecords),
    filteredServices: vi.fn(() => sampleRecords),
    isLoading: vi.fn(() => false),
    isSubmitting: vi.fn(() => false),
    errorMessage: vi.fn(() => null),
    filter: vi.fn(() => 'all'),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    await TestBed.configureTestingModule({
      imports: [ServicesManageComponent, ServiceFormComponent],
      providers: [{ provide: ServicesManagePageStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('loads services on init', () => {
    expect(store.load).toHaveBeenCalled();
  });

  it('delegates create when no editing service is active', async () => {
    store.editingService.mockReturnValue(null);

    await component.handleSave({
      slug: 'new-service',
      name: 'New Service',
      description: 'A new service',
      duration_minutes: 45,
      price_amount: '1500.00',
      currency: 'PHP',
      is_active: true,
    });

    expect(store.create).toHaveBeenCalledWith({
      slug: 'new-service',
      name: 'New Service',
      description: 'A new service',
      duration_minutes: 45,
      price_amount: '1500.00',
      currency: 'PHP',
      is_active: true,
    });
    expect(store.update).not.toHaveBeenCalled();
  });

  it('delegates update when an editing service is active', async () => {
    store.editingService.mockReturnValue(sampleRecords[0]);

    await component.handleSave({
      slug: 'initial-consult',
      name: 'Initial Consultation Updated',
      description: 'Updated description',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
    });

    expect(store.update).toHaveBeenCalledWith('svc-1', {
      slug: 'initial-consult',
      name: 'Initial Consultation Updated',
      description: 'Updated description',
      duration_minutes: 60,
      price_amount: '2500.00',
      currency: 'PHP',
      is_active: true,
    });
    expect(store.create).not.toHaveBeenCalled();
  });

  it('delegates deactivate', async () => {
    await component.deactivate('svc-1');
    expect(store.deactivate).toHaveBeenCalledWith('svc-1');
  });

  it('delegates reactivate', async () => {
    await component.reactivate('svc-1');
    expect(store.reactivate).toHaveBeenCalledWith('svc-1');
  });

  it('delegates filter change', () => {
    component.changeFilter('active');
    expect(store.setFilter).toHaveBeenCalledWith('active');
  });

  it('delegates cancel editing', () => {
    component.cancelEditing();
    expect(store.stopEditing).toHaveBeenCalledTimes(1);
  });
});
