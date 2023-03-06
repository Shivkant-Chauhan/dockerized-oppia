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
 * @fileoverview Component for the supplemental card.
 */

import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { StateCard } from 'domain/state_card/state-card.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { AudioPlayerService } from 'services/audio-player.service';
import { AutogeneratedAudioPlayerService } from 'services/autogenerated-audio-player.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { AudioTranslationManagerService } from '../services/audio-translation-manager.service';
import { CurrentInteractionService } from '../services/current-interaction.service';
import { PlayerPositionService } from '../services/player-position.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

import './supplemental-card.component.css';


@Component({
  selector: 'oppia-supplemental-card',
  templateUrl: './supplemental-card.component.html',
  styleUrls: ['./supplemental-card.component.css']
})
export class SupplementalCardComponent implements OnInit, OnDestroy {
  @Output() clickContinueButton: EventEmitter<void> = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() isLearnAgainButton!: boolean;
  @Input() displayedCard!: StateCard;
  @ViewChild('helpCard') helpCard!: ElementRef;
  @ViewChild('interactionContainer') interactionContainer!: ElementRef;
  currentDisplayedCard!: StateCard;
  // Help card html is set to null when the help card is tall. This is to
  // prevent the help card from being displayed when the help card is tall.
  helpCardHtml!: string | null;
  OPPIA_AVATAR_IMAGE_URL!: string;
  directiveSubscriptions = new Subscription();
  // Last answer is null if their is no answer.
  lastAnswer: { answerDetails: string } | string | null = null;
  maxHelpCardHeightSeen: number = 0;
  helpCardHasContinueButton: boolean = false;
  CONTINUE_BUTTON_FOCUS_LABEL: string = (
    ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL);

  helpCardBottomPosition: number = 0;

  constructor(
    private audioPlayerService: AudioPlayerService,
    private audioTranslationManagerService: AudioTranslationManagerService,
    private autogeneratedAudioPlayerService: AutogeneratedAudioPlayerService,
    private changeDetectorRef: ChangeDetectorRef,
    private currentInteractionService: CurrentInteractionService,
    private el: ElementRef,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private playerPositionService: PlayerPositionService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));

    this.currentInteractionService.registerPresubmitHook(() => {
      // Do not clear the help card or submit an answer if there is an
      // upcoming card.
      if (this.currentDisplayedCard.isCompleted()) {
        return;
      }

      this.clearHelpCard();
    });

    this.directiveSubscriptions.add(
      this.playerPositionService.onActiveCardChanged.subscribe(
        () => {
          this.updateDisplayedCard();
        }
      )
    );

    this.directiveSubscriptions.add(
      this.playerPositionService.onHelpCardAvailable.subscribe(
        (helpCard) => {
          this.helpCardHtml = helpCard.helpCardHtml;
          this.helpCardHasContinueButton = helpCard.hasContinueButton;
        }
      )
    );
    this.updateDisplayedCard();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.displayedCard) {
      this.displayedCard = changes.displayedCard.currentValue;
      this.updateDisplayedCard();
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  updateDisplayedCard(): void {
    this.currentDisplayedCard = this.displayedCard;
    this.clearHelpCard();
    this.lastAnswer = null;
    if (this.displayedCard.isCompleted()) {
      this.lastAnswer = this.currentDisplayedCard.getLastAnswer();
    }
  }

  // We use the max because the height property of the help card is
  // unstable while animating, causing infinite digest errors.
  clearHelpCard(): void {
    this.helpCardHtml = null;
    this.helpCardHasContinueButton = false;
    this.maxHelpCardHeightSeen = 0;
  }

  isHelpCardTall(): boolean {
    const el: HTMLDivElement = this.el.nativeElement.getElementsByClassName(
      'conversation-skin-help-card'
    )[0];
    let helpCardHeight = el.offsetHeight;

    if (helpCardHeight > this.maxHelpCardHeightSeen) {
      this.maxHelpCardHeightSeen = helpCardHeight;
    }

    if (this.maxHelpCardHeightSeen >
      this.windowRef.nativeWindow.innerHeight - 100) {
      return true;
    }

    this.updateHelpCardBottomPosition();
    return false;
  }

  updateHelpCardBottomPosition(): void {
    let helpCardHeight = 0;
    if (this.helpCard) {
      helpCardHeight = this.helpCard.nativeElement.clientHeight;
    }

    let containerHeight = (
      this.interactionContainer.nativeElement.clientHeight);

    let bottomPosition = Math.max(containerHeight - helpCardHeight / 2, 0);

    if (this.helpCardBottomPosition !== bottomPosition) {
      this.helpCardBottomPosition = bottomPosition;
      this.changeDetectorRef.detectChanges();
    }
  }

  // This function returns null if audio is not available.
  getFeedbackAudioHighlightClass(): string | null {
    if (this.audioTranslationManagerService
      .getCurrentComponentName() ===
      AppConstants.COMPONENT_NAME_FEEDBACK &&
      (this.audioPlayerService.isPlaying() ||
      this.autogeneratedAudioPlayerService.isPlaying())) {
      return ExplorationPlayerConstants.AUDIO_HIGHLIGHT_CSS_CLASS;
    }
    return null;
  }
}

angular.module('oppia').directive('oppiaSupplementalCard',
  downgradeComponent({
    component: SupplementalCardComponent
  }) as angular.IDirectiveFactory);
