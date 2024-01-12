import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import {ToastService} from '../../../../shared/providers/toast.service';

@Component({
  selector: 'app-mapping-modal',
  templateUrl: './mapping-modal.component.html',
  styleUrls: ['./mapping-modal.component.scss'],
})
export class MappingModalComponent implements OnInit {
  @ViewChild('nameInput') nameElement: any;

  public name: string;
  public placeHolder: string;
  @Input() type: string;
  @Input() target: any;

  constructor(public toaster: ToastService, public modalController: ModalController) { }

  ngOnInit() {
    this.name = this.type === 'update' ? this.target.name : null;
    if (this.type === 'create') {
      if (this.target.id) {
        this.placeHolder = `请输入${this.target.name}子节点名`;
      } else {
        this.placeHolder = `请输入根节点名`;
      }
    } else {
      this.placeHolder = this.target.name;
    }
    setTimeout(() => {this.nameElement.setFocus(); }, 500);
  }

  dismiss(value: string) {
    this.modalController.dismiss({value});
  }

  add() {
    if (!this.name) {
      this.toaster.toast({msg: '请输入节点名'});
      return;
    }
    if (!this.target.id) {
      this.target.id = this.generateUUID();
      this.target.name = this.name;
      this.target.children = [];
    } else {
      if (!this.target.children) {
        this.target.children = [];
      }
      const node = {id: this.generateUUID(), name: this.name, children: []};
      this.target.children.push(node);
    }
    this.dismiss('add');
  }
  update() {
    if (!this.name) {
      this.toaster.toast({msg: '请输入节点名'});
      return;
    }
    this.target.name = this.name;
    this.dismiss('update');
  }

  generateUUID() {
    let d = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }
}
