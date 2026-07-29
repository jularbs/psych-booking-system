import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ServicesManageComponent } from './services-manage.component';
import { ServicesApiService } from '../../data-access/services-api.service';

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

  const servicesApiService = {
    listManage: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    servicesApiService.listManage.mockReturnValue(of(sampleRecords));

    await TestBed.configureTestingModule({
      imports: [ServicesManageComponent],
      providers: [{ provide: ServicesApiService, useValue: servicesApiService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ServicesManageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should load services via toSignal on component creation', () => {
    expect(servicesApiService.listManage).toHaveBeenCalledTimes(1);
    expect(component.services().length).toBe(1);
    expect(component.services()[0].name).toBe('Initial Consultation');
  });
});
