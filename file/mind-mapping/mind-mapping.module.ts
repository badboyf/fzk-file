import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import {NgxEchartsModule} from 'ngx-echarts';
import { IonicModule } from '@ionic/angular';
import { MappingModalComponent } from './mapping-modal/mapping-modal.component';
import { MindMappingPage } from './mind-mapping.page';
import { AppCommonModule } from '../../component/app-common.module';
import { TreeLevelComponent } from './tree-level/tree-level.component';
import { MappingArticlePopComponent } from './mapping-article-pop/mapping-article-pop.component';

const routes: Routes = [
  {
    path: '',
    component: MindMappingPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AppCommonModule,
    NgxEchartsModule,
    RouterModule.forChild(routes)
  ],
  declarations: [
    MindMappingPage,
    MappingModalComponent,
    MappingArticlePopComponent,
    TreeLevelComponent
  ],
  entryComponents: [
    MappingModalComponent,
    MappingArticlePopComponent
  ]
})
export class MindMappingPageModule {}
