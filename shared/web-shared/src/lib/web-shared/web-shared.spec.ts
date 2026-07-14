import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebShared } from './web-shared';

describe('WebShared', () => {
  let component: WebShared;
  let fixture: ComponentFixture<WebShared>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebShared],
    }).compileComponents();

    fixture = TestBed.createComponent(WebShared);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
