import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MappingArticlePopComponent } from './mapping-article-pop.component';

describe('MappingArticlePopComponent', () => {
  let component: MappingArticlePopComponent;
  let fixture: ComponentFixture<MappingArticlePopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MappingArticlePopComponent ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MappingArticlePopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
