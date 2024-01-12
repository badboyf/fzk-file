import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { MappingArticlePopComponent } from '../mapping-article-pop/mapping-article-pop.component';

@Component({
  selector: 'app-tree-level',
  templateUrl: './tree-level.component.html',
  styleUrls: ['./tree-level.component.scss'],
})
export class TreeLevelComponent implements OnInit {

  @Input() public trees: [];
  @Input() public operateNode: any;

  @Output() selectNode = new EventEmitter<any>();

  constructor(public popoverController: PopoverController) { }

  ngOnInit() {}

  async clickNode(event: any, node: any) {
    if (!this.operateNode.editable) {
      this.popDetail(event, node);
      return;
    }
    if (!this.operateNode.type) {
      this.operateNode.select = node;
    }
    this.selectNode.emit({event, node});
  }

  subLevleClick(value) {
    this.clickNode(value.event, value.node);
  }

  async popDetail(event: any, node: any) {
    const popover = await this.popoverController.create({
      component: MappingArticlePopComponent,
      componentProps: {articleId: node.id},
      event,
      translucent: true
    });
    return await popover.present();
  }
}
