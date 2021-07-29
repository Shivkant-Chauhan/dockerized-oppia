// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for recommending explorations at the end of an
 * exploration.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ContextService } from 'services/context.service';
import { ServicesConstants } from 'services/services.constants';
import { UrlService } from 'services/contextual/url.service';

import { ExplorationRecommendationsBackendApiService } from
  'domain/recommendations/exploration-recommendations-backend-api.service';
import { LearnerExplorationSummary } from
  'domain/summary/learner-exploration-summary.model';

@Injectable({
  providedIn: 'root'
})
export class ExplorationRecommendationsService {
  isIframed: boolean = false;
  isInEditorPage: boolean = false;
  isInEditorPreviewMode: boolean = false;
  // 'explorationId' is only used in 'getRecommendedSummaryDicts()' and is
  // assigned a value before it is used, hence we need to do non-null assertion.
  explorationId!: string;

  constructor(
    private contextService: ContextService,
    private urlService: UrlService,
    private expRecommendationBackendApiService:
    ExplorationRecommendationsBackendApiService) {
    this.isIframed = this.urlService.isIframed();
    this.isInEditorPage = (
      this.contextService.getPageContext() ===
      ServicesConstants.PAGE_CONTEXT.EXPLORATION_EDITOR);
    this.isInEditorPreviewMode = (
      this.isInEditorPage && (
        this.contextService.getEditorTabContext() ===
        ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW));
  }

  getRecommendedSummaryDicts(
      authorRecommendedExpIds: string[],
      includeAutogeneratedRecommendations: boolean,
      successCallback: (value: LearnerExplorationSummary[]) => void): void {
    let collectionId = this.urlService.getCollectionIdFromExplorationUrl();
    let storyId = this.urlService.getUrlParams().story_id;
    let currentNodeId = this.urlService.getUrlParams().node_id;
    this.explorationId = this.contextService.getExplorationId();

    let includeSystemRecommendations = 'false';

    if (
      includeAutogeneratedRecommendations &&
      !this.isInEditorPage) {
      includeSystemRecommendations = 'true';
    }

    this.expRecommendationBackendApiService.getRecommendedSummaryDictsAsync(
      authorRecommendedExpIds, includeSystemRecommendations,
      collectionId, storyId, currentNodeId, this.explorationId
    ).then(expSummaries => {
      successCallback(expSummaries);
    });
  }
}
angular.module('oppia').factory('ExplorationRecommendationsService',
  downgradeInjectable(ExplorationRecommendationsService));
