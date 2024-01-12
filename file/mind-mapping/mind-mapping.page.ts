import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import {ToastService} from '../../../shared/providers/toast.service';
import { TreeDiagramService, TREE_OPTION } from '../../component/service/tree-diagram.service';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../component/service/api.service';
import { PageLoadingService } from '../../component/service/page-loading.service';

@Component({
  selector: 'app-mind-mapping',
  templateUrl: './mind-mapping.page.html',
  styleUrls: ['./mind-mapping.page.scss'],
})
export class MindMappingPage implements OnInit {
  public topicId: number;
  public height: string;

  public trees: any = [];
  public operateNode = {
    select: null,
    type: null,
    editable: false
  };

  constructor(public modalController: ModalController, public toaster: ToastService,
              public treeDiagramService: TreeDiagramService, public activatedRoute: ActivatedRoute,
              public apiService: ApiService, public loadingService: PageLoadingService,
              public nav: NavController) { }

  async ngOnInit() {
    let lastNode = {name: "第0", id: 100, child: null};
    for (let i = 101; i < 120; i++) { lastNode = {name: `第${i}`, id: i, child: [lastNode]}; }
    this.trees.push(lastNode);
    this.height = (window.innerHeight) + 'px';
    await this.loadingService.loading();
    this.topicId = +this.activatedRoute.snapshot.queryParams.topicId;

    this.apiService.querytopic({topicID: this.topicId}).valueChanges.subscribe((data: any) => {
      const trees = data.data.topic.mind_map && data.data.topic.mind_map.value;
      if (trees) {
        this.trees = trees;
      } else {
        const v = {topicID: this.topicId, size: 0, startID: 0, total: true};
        this.apiService.querytopicArticlesOnlyTitle(v).valueChanges.subscribe((articlesData: any) => {
          articlesData.data.topicArticles.forEach((tmp: any) => {
            this.trees.push({name: tmp.title, id: tmp.id});
          });
        }, error => {
          this.handleErr(error);
        });
      }

      this.loadingService.dismiss();
    }, (err: any) => this.handleErr(err));

  }
  handleErr(error: any) {
    this.loadingService.forceDismiss();
    this.toaster.toast({msg: "网络请求失败"});
  }

  goBack() {
    this.nav.back();
  }

  delete() {
    if (!this.operateNode.editable) {
      this.toaster.toast({msg: '当前状态下不可编辑'});
      return;
    }
    if (!this.operateNode.select) {
      this.toaster.toast({msg: '请选择节点'});
      return;
    }

    const parent = this.parent(this.operateNode.select, this.trees);
    if (parent) {
      this.removeChild(this.operateNode.select, parent);
      this.trees.push(this.operateNode.select);
    }
  }

  clickSub() {
    if (!this.operateNode.editable) {
      this.toaster.toast({msg: '当前状态下不可编辑'});
      return;
    }
    if (!this.operateNode.select) {
      this.toaster.toast({msg: '请选择节点'});
      return;
    } else if (this.operateNode.type === 'sub') {
      this.operateNode.type = null;
      return;
    }
    this.operateNode.type = "sub";
    this.toaster.toast({msg: '请选择下一个节点'});
  }

  clickSibling() {
    if (!this.operateNode.editable) {
      this.toaster.toast({msg: '当前状态下不可编辑'});
      return;
    }
    if (!this.operateNode.select) {
      this.toaster.toast({msg: '请选择节点'});
      return;
    } else if (this.operateNode.type === 'sibling') {
      this.operateNode.type = null;
      return;
    }
    this.operateNode.type = "sibling";
    this.toaster.toast({msg: '请选择下一个节点'});
  }

  save() {
    this.loadingService.loading();
    const v = {
      topicID: this.topicId,
      updateContent: {
        mind_map: {value: this.trees}
      }
    };
    this.apiService.mutationapplyForUpdateTopic(v).subscribe(data => {
      this.loadingService.dismiss();
    }, err => this.handleErr(err));
  }

  selectNode(value: any) {
    const node = value.node;
    if (this.isParent(node, this.operateNode.select) || node.id === this.operateNode.select.id) {
      this.toaster.toast({msg: "接选择正确节点"});
      return;
    }
    if (this.operateNode.type === 'sub') {
      this.optSub(node);
    } else if (this.operateNode.type === 'sibling') {
      this.optSibling(node);
    }
    this.operateNode.type = null;
  }
  optSibling(node: any) {
    const parent = this.parent(node, this.trees);
    this.removeChild(node, parent);
    const firstNodeParent = this.parent(this.operateNode.select, this.trees);
    if (firstNodeParent) {
      firstNodeParent.child.push(node);
    } else {
      this.trees.push(node);
    }
  }
  optSub(node: any) {
    const parent = this.parent(node, this.trees);
    this.removeChild(node, parent);
    if (!this.operateNode.select.child) {
      this.operateNode.select.child = [];
    }
    this.operateNode.select.child.push(node);
  }

  toggleEditable() {
    if (this.operateNode.editable) {
      this.operateNode.select = null;
      this.operateNode.type = null;
    }
    this.operateNode.editable = !this.operateNode.editable;
  }


  public removeChild(target: any, parent: any) {
    if (parent) {
      parent.child = parent.child.filter((t: any) => t.id !== target.id);
    } else {
      this.trees = this.trees.filter((tmp: any) => target.id !== tmp.id);
    }
  }

  public parent(target: any, findList: []) {
    if (!findList) {return null; }
    for (const tmp of findList) {
      const result = this.findParent(target, tmp);
      if (result != null) {
        return result;
      }
    }
  }
  public findParent(target: any, node: any) {
    if (node.id === target.id) {return null; }
    if (!node.child) {return null; }
    for (const tmp of node.child) {
      if (tmp.id === target.id) {return node; }
      const result = this.findParent(target, tmp);
      if (result != null) {
        return result;
      }
    }
    return null;
  }
  public isParent(parent: any, node: any) {
    if (!parent || !parent.child) {return false; }
    for (const tmp of parent.child) {
      if (tmp.id === node.id || this.isParent(tmp, node)) {
        return true;
      }
    }
    return false;
  }
}
