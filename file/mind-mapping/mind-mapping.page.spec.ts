import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MindMappingPage } from './mind-mapping.page';

describe('MindMappingPage', () => {
  let component: MindMappingPage;
  let fixture: ComponentFixture<MindMappingPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MindMappingPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MindMappingPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
