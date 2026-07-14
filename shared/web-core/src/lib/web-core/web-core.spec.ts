import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebCore } from './web-core';

describe('WebCore', () => {
  let component: WebCore;
  let fixture: ComponentFixture<WebCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebCore],
    }).compileComponents();

    fixture = TestBed.createComponent(WebCore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
