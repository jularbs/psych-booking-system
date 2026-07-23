import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { BookingHomeComponent } from './booking-home.component';

describe('BookingHome', () => {
  let component: BookingHomeComponent;
  let fixture: ComponentFixture<BookingHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingHomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BookingHomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
