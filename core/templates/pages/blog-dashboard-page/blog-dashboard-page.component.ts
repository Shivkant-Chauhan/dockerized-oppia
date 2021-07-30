// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar breadcrumb of the blog dashboard.
 */

import { Component, OnInit} from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { BlogDashboardData, BlogDashboardBackendApiService } from 'domain/blog/blog-dashboard-backend-api.service';
import { LoaderService } from 'services/loader.service';

@Component({
  selector: 'oppia-blog-dashboard-page',
  templateUrl: './blog-dashboard-page.component.html'
})
export class BlogDashboardPageComponent implements OnInit {
  blogDashboardData: BlogDashboardData;
  authorProfilePictureUrl: string;
  DEFAULT_PROFILE_PICTURE_URL: string = '';

  constructor(
    private alertsService: AlertsService,
    private blogDashboardBackendService: BlogDashboardBackendApiService,
    private loaderService: LoaderService,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.DEFAULT_PROFILE_PICTURE_URL = this.urlInterpolationService
      .getStaticImageUrl('/general/no_profile_picture.png');
    this.blogDashboardBackendService.fetchBlogDashboardDataAsync().then(
      (dashboardData) => {
        this.blogDashboardData = dashboardData;
        this.authorProfilePictureUrl = decodeURIComponent((
          // eslint-disable-next-line max-len
          dashboardData.profilePictureDataUrl || this.DEFAULT_PROFILE_PICTURE_URL));
        this.loaderService.hideLoadingScreen();
      }, (errorResponse) => {
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(
            errorResponse.status) !== -1) {
          this.alertsService.addWarning('Failed to get blog dashboard data');
        }
      });
  }
}

angular.module('oppia').directive('oppiaBlogDashboardPage',
  downgradeComponent({
    component: BlogDashboardPageComponent
  }) as angular.IDirectiveFactory);
