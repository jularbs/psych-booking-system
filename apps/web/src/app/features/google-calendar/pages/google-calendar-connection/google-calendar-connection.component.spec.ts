import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleCalendarConnectionComponent } from './google-calendar-connection.component';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GoogleCalendarConnectionPageStore } from './google-calendar-connection-page.store';

describe('GoogleCalendarConnectionComponent', () => {
  let component: GoogleCalendarConnectionComponent;
  let fixture: ComponentFixture<GoogleCalendarConnectionComponent>;

  const store = {
    load: vi.fn(),
    revokeConnection: vi.fn(),
    connection: vi.fn(() => null),
    isLoading: vi.fn(() => false),
    isSubmitting: vi.fn(() => false),
    errorMessage: vi.fn(() => null),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    TestBed.overrideComponent(GoogleCalendarConnectionComponent, {
      set: {
        providers: [{ provide: GoogleCalendarConnectionPageStore, useValue: store }],
      },
    });

    await TestBed.configureTestingModule({
      imports: [GoogleCalendarConnectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GoogleCalendarConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the current connection on init', () => {
    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it('delegates revoke action to the store', async () => {
    await component.revoke();

    expect(store.revokeConnection).toHaveBeenCalledTimes(1);
  });
});
