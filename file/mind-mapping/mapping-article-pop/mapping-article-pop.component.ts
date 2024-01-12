import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../component/service/api.service';
import { NavController, PopoverController } from '@ionic/angular';
import { ToastService } from '../../../../shared/providers/toast.service';

@Component({
  selector: 'app-mapping-article-pop',
  templateUrl: './mapping-article-pop.component.html',
  styleUrls: ['./mapping-article-pop.component.scss'],
})
export class MappingArticlePopComponent implements OnInit {
  public articleId: any;
  public article: any;
  constructor(public activatedRoute: ActivatedRoute, public apiService: ApiService,
              public toaster: ToastService, public nav: NavController, public popoverController: PopoverController) { }

  ngOnInit() {
    this.apiService.queryarticle({id: this.articleId}).valueChanges.subscribe((data: any) => {
      this.article = data.data.article;
    }, err => {
      this.toaster.toast({msg: "网络请求失败"});
    });
  }

  gotoArticleDetail() {
    this.popoverController.dismiss();
    this.nav.navigateForward(`article-detail/${this.articleId}`);
  }
}
