import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPageLayout } from './main-page-layout';

describe('MainPageLayout', () => {
  let component: MainPageLayout;
  let fixture: ComponentFixture<MainPageLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainPageLayout],
    }).compileComponents();

    fixture = TestBed.createComponent(MainPageLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
