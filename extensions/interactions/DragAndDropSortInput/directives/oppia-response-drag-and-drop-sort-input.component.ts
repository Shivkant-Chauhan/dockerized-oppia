// Copyright 2019 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the DragAndDropSortInput response.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { DragAndDropAnswer } from 'interactions/answer-defs';

@Component({
  selector: 'oppia-response-drag-and-drop-sort-input',
  templateUrl: './drag-and-drop-sort-input-response.component.html',
  styleUrls: []
})
export class ResponseDragAndDropSortInputComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() answer!: string;
  isAnswerLengthGreaterThanZero: boolean;
  responseList: DragAndDropAnswer;

  constructor(private htmlEscaperService: HtmlEscaperService) {}

  ngOnInit(): void {
    this.responseList = this.htmlEscaperService.escapedJsonToObj(
      this.answer) as DragAndDropAnswer;
    this.isAnswerLengthGreaterThanZero = this.responseList.length > 0;
  }

  chooseItemType(index: number): string {
    return (
      index === 0 ?
      'drag-and-drop-response-item' :
      'drag-and-drop-response-subitem'
    );
  }
}

angular.module('oppia').directive(
  'oppiaResponseDragAndDropSortInput', downgradeComponent({
    component: ResponseDragAndDropSortInputComponent
  }) as angular.IDirectiveFactory);
