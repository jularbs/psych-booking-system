import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GoogleCalendarConnectionComponent } from './google-calendar-connection.component';
import { GoogleCalendarConnectionPageStore } from './google-calendar-connection-page.store';

describe('GoogleCalendarConnectionComponent', () => {
  let fixture: ComponentFixture<GoogleCalendarConnectionComponent>;
  let component: GoogleCalendarConnectionComponent;

  const store = {
    load: vi.fn(),
    connectOrRefreshAuth: vi.fn(),
    selectCalendar: vi.fn(),
    revokeConnection: vi.fn(),
    connection: vi.fn(() => null),
    availableCalendars: vi.fn(() => []),
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

  it('loads connection state on init', () => {
    expect(store.load).toHaveBeenCalledTimes(1);
  });

  it('delegates oauth connect action to the store', async () => {
    await component.connectOrRefreshAuth();

    expect(store.connectOrRefreshAuth).toHaveBeenCalledTimes(1);
  });

  it('delegates calendar selection to the store', async () => {
    await component.selectCalendar({
      id: 'primary',
      summary: 'Primary Calendar',
    });

    expect(store.selectCalendar).toHaveBeenCalledWith({
      id: 'primary',
      summary: 'Primary Calendar',
    });
  });

  it('delegates revoke action to the store', async () => {
    await component.revoke();

    expect(store.revokeConnection).toHaveBeenCalledTimes(1);
  });

  it('exposes store state to the template', () => {
    expect(component.connection()).toBeNull();
    expect(component.availableCalendars()).toEqual([]);
    expect(component.isLoading()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });
});
