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
 * @fileoverview Component for the Tutor Card.
 */

import { Component, Input, SimpleChanges, ViewChild, Renderer2 } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { TranslateService } from '@ngx-translate/core';
import { AppConstants } from 'app.constants';
import { BindableVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { StateCard } from 'domain/state_card/state-card.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { Subscription } from 'rxjs';
import { AudioBarStatusService } from 'services/audio-bar-status.service';
import { AudioPlayerService } from 'services/audio-player.service';
import { AutogeneratedAudioPlayerService } from 'services/autogenerated-audio-player.service';
import { ContextService } from 'services/context.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UserService } from 'services/user.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { AudioPreloaderService } from '../services/audio-preloader.service';
import { AudioTranslationManagerService } from '../services/audio-translation-manager.service';
import { CurrentInteractionService } from '../services/current-interaction.service';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { LearnerAnswerInfoService } from '../services/learner-answer-info.service';
import { PlayerPositionService } from '../services/player-position.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { CollectionSummary } from 'domain/collection/collection-summary.model';
import { LearnerExplorationSummary } from 'domain/summary/learner-exploration-summary.model';
import { EndChapterCheckMarkComponent } from './end-chapter-check-mark.component';
import { EndChapterConfettiComponent } from './end-chapter-confetti.component';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { QuestionPlayerConfig } from './ratings-and-recommendations.component';

const CHECK_MARK_HIDE_DELAY_IN_MSECS = 500;
const REDUCED_MOTION_ANIMATION_DURATION_IN_MSECS = 2000;
const CONFETTI_ANIMATION_DELAY_IN_MSECS = 2000;
const STANDARD_ANIMATION_DURATION_IN_MSECS = 4000;
const MILESTONE_SPECIFIC_COMPLETED_CHAPTER_COUNTS = [1, 5, 10, 25, 50];

import './tutor-card.component.css';


@Component({
  selector: 'oppia-tutor-card',
  templateUrl: './tutor-card.component.html',
  animations: [
    trigger('expandInOut', [
      state('in', style({
        overflow: 'visible',
        height: '*'
      })),
      state('out', style({
        overflow: 'hidden',
        height: '0px',
        display: 'none'
      })),
      transition('in => out', animate('500ms ease-in-out')),
      transition('out => in', [
        style({ display: 'block' }),
        animate('500ms ease-in-out')
      ])
    ]),
    trigger('fadeInOut', [
      transition('void => *', []),
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('1s ease', keyframes([
          style({ opacity: 0 }),
          style({ opacity: 1 })
        ]))
      ])
    ])
  ]
})
export class TutorCardComponent {
  @ViewChild('checkMark') checkMarkComponent: EndChapterCheckMarkComponent;
  @ViewChild('confetti') confettiComponent: EndChapterConfettiComponent;
  @Input() displayedCard: StateCard;
  @Input() displayedCardWasCompletedInPrevSession: boolean;
  @Input() startCardChangeAnimation: boolean;
  @Input() avatarImageIsShown: boolean;
  @Input() userIsLoggedIn: boolean;
  @Input() explorationIsInPreviewMode: boolean;
  @Input() questionPlayerConfig: QuestionPlayerConfig;
  @Input() collectionSummary: CollectionSummary;
  @Input() isRefresherExploration: boolean;
  @Input() recommendedExplorationSummaries: LearnerExplorationSummary[];
  @Input() parentExplorationIds: string[];
  @Input() inStoryMode: boolean;
  // The below property will be undefined when the current chapter
  // is the last chapter of a story.
  @Input() nextLessonLink: string | undefined;
  // 'completedChaptersCount' is fetched via a HTTP request.
  // Until the response is received, it remains undefined.
  @Input() completedChaptersCount: number | undefined;
  @Input() milestoneMessageIsToBeDisplayed!: boolean;
  directiveSubscriptions = new Subscription();
  private _editorPreviewMode: boolean;
  arePreviousResponsesShown: boolean = false;
  lastAnswer: string;
  conceptCardIsBeingShown: boolean;
  interactionIsActive: boolean;
  waitingForOppiaFeedback: boolean = false;
  interactionInstructions: string;
  contentAudioTranslations: BindableVoiceovers;
  isIframed: boolean;
  getCanAskLearnerForAnswerInfo: () => boolean;
  OPPIA_AVATAR_IMAGE_URL: string;
  OPPIA_AVATAR_LINK_URL: string;
  profilePicture: string;
  nextMilestoneChapterCount: number | null = null;
  checkMarkHidden: boolean = true;
  animationHasPlayedOnce: boolean = false;
  checkMarkSkipped: boolean = false;
  confettiAnimationTimeout: NodeJS.Timeout | null = null;
  skipClickListener: Function | null = null;

  constructor(
    private audioBarStatusService: AudioBarStatusService,
    private audioPlayerService: AudioPlayerService,
    private audioPreloaderService: AudioPreloaderService,
    private audioTranslationManagerService: AudioTranslationManagerService,
    private autogeneratedAudioPlayerService: AutogeneratedAudioPlayerService,
    private contextService: ContextService,
    private currentInteractionService: CurrentInteractionService,
    private deviceInfoService: DeviceInfoService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private learnerAnswerInfoService: LearnerAnswerInfoService,
    private playerPositionService: PlayerPositionService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
    private platformFeatureService: PlatformFeatureService,
    private renderer: Renderer2,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this._editorPreviewMode = this.contextService.isInExplorationEditorPage();
    this.isIframed = this.urlService.isIframed();
    this.getCanAskLearnerForAnswerInfo = (
      this.learnerAnswerInfoService.getCanAskLearnerForAnswerInfo);
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService
        .getStaticImageUrl('/avatar/oppia_avatar_100px.svg'));
    this.OPPIA_AVATAR_LINK_URL = AppConstants.OPPIA_AVATAR_LINK_URL;

    this.profilePicture = this.urlInterpolationService
      .getStaticImageUrl('/avatar/user_blue_72px.png');

    if (!this._editorPreviewMode) {
      this.userService.getProfileImageDataUrlAsync().then((dataUrl) => {
        this.profilePicture = dataUrl;
      });
    } else {
      this.profilePicture = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PATH));
    }

    this.directiveSubscriptions.add(
      this.explorationPlayerStateService.onOppiaFeedbackAvailable.subscribe(
        () => {
          this.waitingForOppiaFeedback = false;

          // Auto scroll to the new feedback on mobile device.
          if (this.deviceInfoService.isMobileDevice()) {
            let latestFeedbackIndex = (
              this.displayedCard.getInputResponsePairs().length - 1);

            this.windowRef.nativeWindow.location.hash = (
              this.getInputResponsePairId(latestFeedbackIndex));
          }
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.displayedCard &&
      !isEqual(
        changes.displayedCard.previousValue,
        changes.displayedCard.currentValue)) {
      this.updateDisplayedCard();
    }
    if (
      this.platformFeatureService.status.EndChapterCelebration.isEnabled &&
      this.isOnTerminalCard() &&
      !this.animationHasPlayedOnce &&
      this.inStoryMode
    ) {
      this.triggerCelebratoryAnimation();
    }
  }

  triggerCelebratoryAnimation(): void {
    this.checkMarkHidden = false;
    this.checkMarkComponent.animateCheckMark();
    this.skipClickListener = this.renderer.listen(
      'document', 'click', () => {
        clearTimeout(this.confettiAnimationTimeout);
        this.checkMarkSkipped = true;
        setTimeout(() => {
          this.checkMarkHidden = true;
        }, CHECK_MARK_HIDE_DELAY_IN_MSECS);
      });
    this.animationHasPlayedOnce = true;
    let mediaQuery =
      this.windowRef.nativeWindow.matchMedia('(prefers-reduced-motion)');
    if (mediaQuery.matches) {
      setTimeout(() => {
        this.checkMarkSkipped = true;
        setTimeout(() => {
          this.checkMarkHidden = true;
          this.skipClickListener();
          this.skipClickListener = null;
        }, CHECK_MARK_HIDE_DELAY_IN_MSECS);
      }, REDUCED_MOTION_ANIMATION_DURATION_IN_MSECS);
    } else {
      this.confettiAnimationTimeout = setTimeout(() => {
        this.confettiComponent.animateConfetti();
      }, CONFETTI_ANIMATION_DELAY_IN_MSECS);
      setTimeout(() => {
        this.checkMarkHidden = true;
        this.skipClickListener();
        this.skipClickListener = null;
      }, STANDARD_ANIMATION_DURATION_IN_MSECS);
    }
  }

  generateMilestoneMessage(): string {
    if (!this.inStoryMode ||
        !this.milestoneMessageIsToBeDisplayed ||
        !this.completedChaptersCount ||
        !MILESTONE_SPECIFIC_COMPLETED_CHAPTER_COUNTS.includes(
          this.completedChaptersCount)) {
      return '';
    }
    let chapterCountMessageIndex = (
      MILESTONE_SPECIFIC_COMPLETED_CHAPTER_COUNTS.indexOf(
        this.completedChaptersCount)) + 1;
    let milestoneMessageTranslationKey = (
      'I18N_END_CHAPTER_MILESTONE_MESSAGE_' + chapterCountMessageIndex);
    return this.translateService.instant(milestoneMessageTranslationKey);
  }

  setNextMilestoneAndCheckIfProgressBarIsShown(): boolean {
    if (
      !this.inStoryMode ||
      this.isCompletedChaptersCountGreaterThanLastMilestone() ||
      this.isMilestoneReachedAndMilestoneMessageToBeDisplayed()
    ) {
      this.nextMilestoneChapterCount = null;
      return false;
    }

    if (
      !this.milestoneMessageIsToBeDisplayed &&
      MILESTONE_SPECIFIC_COMPLETED_CHAPTER_COUNTS.includes(
        this.completedChaptersCount)
    ) {
      let chapterCountIndex = (
        MILESTONE_SPECIFIC_COMPLETED_CHAPTER_COUNTS.indexOf(
          this.completedChaptersCount));
      this.nextMilestoneChapterCount = (
        MILESTONE_SPECIFIC_COMPLETED_CHAPTER_COUNTS[chapterCountIndex + 1]);
      return true;
    }

    for (let milestoneCount of MILESTONE_SPECIFIC_COMPLETED_CHAPTER_COUNTS) {
      if (milestoneCount > this.completedChaptersCount) {
        this.nextMilestoneChapterCount = milestoneCount;
        return true;
      }
    }

    return false;
  }

  isMilestoneReachedAndMilestoneMessageToBeDisplayed(): boolean {
    return (
      this.milestoneMessageIsToBeDisplayed &&
      MILESTONE_SPECIFIC_COMPLETED_CHAPTER_COUNTS.includes(
        this.completedChaptersCount
      )
    );
  }

  isCompletedChaptersCountGreaterThanLastMilestone(): boolean {
    return this.completedChaptersCount > 50;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  isAudioBarExpandedOnMobileDevice(): boolean {
    return (
      this.deviceInfoService.isMobileDevice() &&
      this.audioBarStatusService.isAudioBarExpanded()
    );
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  updateDisplayedCard(): void {
    this.arePreviousResponsesShown = false;
    this.lastAnswer = null;
    this.conceptCardIsBeingShown = Boolean(
      !this.displayedCard.getInteraction());
    this.interactionIsActive = !this.displayedCard.isCompleted();
    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardAvailable.subscribe(
        () => this.interactionIsActive = false
      )
    );
    this.currentInteractionService.registerPresubmitHook(() => {
      this.waitingForOppiaFeedback = true;
    });

    if (!this.interactionIsActive) {
      this.lastAnswer = this.displayedCard.getLastAnswer();
    }

    if (!this.conceptCardIsBeingShown) {
      this.interactionInstructions = (
        this.displayedCard.getInteractionInstructions());
      this.contentAudioTranslations = (
        this.displayedCard.getVoiceovers());
      this.audioTranslationManagerService
        .clearSecondaryAudioTranslations();
      this.audioTranslationManagerService.setContentAudioTranslations(
        cloneDeep(this.contentAudioTranslations),
        this.displayedCard.getContentHtml(),
        AppConstants.COMPONENT_NAME_CONTENT);
      this.audioPlayerService.clear();
      this.audioPreloaderService.clearMostRecentlyRequestedAudioFilename();
      this.autogeneratedAudioPlayerService.cancel();
    }
  }

  isInteractionInline(): boolean {
    if (this.conceptCardIsBeingShown) {
      return true;
    }
    return this.displayedCard.isInteractionInline();
  }

  getContentAudioHighlightClass(): Object {
    if (this.audioTranslationManagerService
      .getCurrentComponentName() ===
      AppConstants.COMPONENT_NAME_CONTENT &&
      (this.audioPlayerService.isPlaying() ||
      this.autogeneratedAudioPlayerService.isPlaying())) {
      return ExplorationPlayerConstants.AUDIO_HIGHLIGHT_CSS_CLASS;
    }
  }

  getContentFocusLabel(index: number): string {
    return ExplorationPlayerConstants.CONTENT_FOCUS_LABEL_PREFIX + index;
  }

  toggleShowPreviousResponses(): void {
    this.arePreviousResponsesShown =
      !this.arePreviousResponsesShown;
  }

  isWindowNarrow(): boolean {
    return this.windowDimensionsService.isWindowNarrow();
  }

  canWindowShowTwoCards(): boolean {
    return this.windowDimensionsService.getWidth() >
    ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX;
  }

  showAudioBar(): boolean {
    return (
      !this.isIframed &&
      !this.explorationPlayerStateService.isInQuestionMode());
  }

  isContentAudioTranslationAvailable(): boolean {
    if (this.conceptCardIsBeingShown) {
      return false;
    }
    return (
      this.displayedCard.isContentAudioTranslationAvailable());
  }

  isCurrentCardAtEndOfTranscript(): boolean {
    return !this.displayedCard.isCompleted();
  }

  isOnTerminalCard(): boolean {
    return this.displayedCard.isTerminal();
  }

  getInputResponsePairId(index: number): string {
    return 'input-response-pair-' + index;
  }
}

angular.module('oppia').directive('oppiaTutorCard',
  downgradeComponent({
    component: TutorCardComponent
  }) as angular.IDirectiveFactory);
