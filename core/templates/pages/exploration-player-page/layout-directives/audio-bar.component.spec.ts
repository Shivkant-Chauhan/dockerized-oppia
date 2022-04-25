// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the AudioBarComponent.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MockTranslatePipe } from 'tests/unit-test-utils';

import { AudioBarComponent } from 'pages/exploration-player-page/layout-directives/audio-bar.component';
import { Voiceover } from 'domain/exploration/voiceover.model';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';
import { AudioBarStatusService } from 'services/audio-bar-status.service';
import { AudioPlayerService } from 'services/audio-player.service';
import { AutogeneratedAudioPlayerService } from 'services/autogenerated-audio-player.service';
import { AudioPreloaderService } from '../services/audio-preloader.service';
import { AudioTranslationLanguageService } from '../services/audio-translation-language.service';
import { AudioTranslationManagerService } from '../services/audio-translation-manager.service';
import { PlayerPositionService } from '../services/player-position.service';

describe('Audio Bar Component', () => {
  let component: AudioBarComponent;
  let fixture: ComponentFixture<AudioBarComponent>;

  let assetsBackendApiService: AssetsBackendApiService;
  let audioBarStatusService: AudioBarStatusService;
  let audioPlayerService: AudioPlayerService;
  let audioPreloaderService: AudioPreloaderService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let audioTranslationManagerService: AudioTranslationManagerService;
  let autogeneratedAudioPlayerService: AutogeneratedAudioPlayerService;
  let playerPositionService: PlayerPositionService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        AudioBarComponent,
        MockTranslatePipe
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioBarComponent);
    component = fixture.componentInstance;
    audioPlayerService = TestBed.inject(AudioPlayerService);
    audioBarStatusService = TestBed.inject(AudioBarStatusService);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService);
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    audioTranslationManagerService = TestBed.inject(
      AudioTranslationManagerService);
    autogeneratedAudioPlayerService = TestBed.inject(
      AutogeneratedAudioPlayerService);
    playerPositionService = TestBed.inject(PlayerPositionService);

    fixture.detectChanges();
  });
  beforeEach(() => {
    spyOn(audioBarStatusService, 'markAudioBarExpanded').and.callThrough();
    spyOn(audioBarStatusService, 'markAudioBarCollapsed').and.callThrough();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set secondary audio translations when audio bar ' +
    'is opened and audio is playing', fakeAsync(() => {
    let params = {
      audioTranslations: {},
      componentName: 'feedback',
      html: ''
    };
    let mockOnAutoplayAudioEventEmitter = new EventEmitter();
    spyOnProperty(audioPlayerService, 'onAutoplayAudio')
      .and.returnValue(mockOnAutoplayAudioEventEmitter);
    let secondaryTranslaionsSpy = spyOn(
      audioTranslationManagerService, 'setSecondaryAudioTranslations')
      .and.callThrough();

    component.ngOnInit();
    component.expandAudioBar();
    component.isPaused = false;
    fixture.detectChanges();

    mockOnAutoplayAudioEventEmitter.emit(params);
    flush();
    discardPeriodicTasks();
    fixture.detectChanges();

    expect(secondaryTranslaionsSpy).toHaveBeenCalledWith(
      params.audioTranslations, params.html, params.componentName);
  }));

  it('should set current time when calling \'setProgress\'', () => {
    // This time period is used to set progress
    // when user pulls the drag button in audio bar.
    let param = {
      value: 100
    };
    let currentTimeSpy = spyOn(
      audioPlayerService, 'setCurrentTime').and.callThrough();

    component.setProgress(param);

    expect(currentTimeSpy).toHaveBeenCalledWith(100);
  });

  it('should check whether the auto generated language ' +
    'code is selected', () => {
    let autoGeneratedLanguageSpy = spyOn(
      audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
      .and.returnValue(false);
    let result = component.isAutogeneratedLanguageCodeSelected();

    expect(result).toBe(false);
    expect(autoGeneratedLanguageSpy).toHaveBeenCalled();
  });

  it('should check if the audio bar is available', () => {
    // Audio bar is only accessible if the number of
    // available languages are greater than one.
    component.languagesInExploration = [
      {
        value: 'en',
        displayed: 'english'
      }, {
        value: 'es',
        displayed: 'spanish'
      }
    ];

    let result = component.isAudioBarAvailable();
    expect(result).toBe(true);

    component.languagesInExploration = [];
    result = component.isAudioBarAvailable();
    expect(result).toBe(false);
  });

  it('should forward audio with time interval of five seconds ' +
    'when audio forward button is clicked', () => {
    let forwardSpy = spyOn(audioPlayerService, 'forward').and.callThrough();

    component.onForwardButtonClicked();

    expect(forwardSpy).toHaveBeenCalledWith(5);
  });

  it('should rewind audio with time interval of five seconds ' +
    'when audio rewind button is clicked', () => {
    let rewindSpy = spyOn(audioPlayerService, 'rewind').and.callThrough();

    component.onBackwardButtonClicked();

    expect(rewindSpy).toHaveBeenCalledWith(5);
  });

  it('should expand audio bar when clicking expand button', () => {
    // Setting audio bar in collapsed view.
    component.audioBarIsExpanded = false;
    component.expandAudioBar();
    expect(component.audioBarIsExpanded).toBe(true);
  });

  it('should collapse audio bar when clicking expand button', () => {
    // Setting audio bar in expanded view.
    component.audioBarIsExpanded = true;
    component.collapseAudioBar();
    expect(component.audioBarIsExpanded).toBe(false);
  });

  it('should return selected audio language code', () => {
    spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
      .and.returnValue('en');
    let result = component.getCurrentAudioLanguageCode();
    expect(result).toBe('en');
  });

  it('should return selected audio language description', () => {
    spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageDescription')
      .and.returnValue('description');
    let result = component.getCurrentAudioLanguageDescription();
    expect(result).toBe('description');
  });

  it('should return voiceovers in selected language', () => {
    let audioTranslation = {
      en: Voiceover.createFromBackendDict({
        filename: 'audio-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      }),
      es: Voiceover.createFromBackendDict({
        filename: 'audio-es.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      })
    };
    spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
      .and.returnValue(audioTranslation);
    // Setting selected language to be 'en'.
    spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
      .and.returnValue('en');

    let result = component.getVoiceoverInCurrentLanguage();
    expect(result).toBe(audioTranslation.en);
  });

  it('should check whether the audio is playing currently', () => {
    let isPlayingSpy = spyOn(
      audioPlayerService, 'isPlaying').and.returnValue(false);
    let result = component.isAudioPlaying();

    expect(result).toBe(false);
    expect(isPlayingSpy).toHaveBeenCalled();
  });

  it('should check whether the audio is selected by ' +
    'auto generated language code', () => {
    let autogeneratedLanguageSpy = spyOn(
      audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
      .and.returnValue(false);
    let result = component.isAutogeneratedLanguageCodeSelected();

    expect(result).toBe(false);
    expect(autogeneratedLanguageSpy).toHaveBeenCalled();
  });

  it('should check if the audio is available in selected language', () => {
    let audioTranslation = {
      en: Voiceover.createFromBackendDict({
        filename: 'audio-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      }),
      es: Voiceover.createFromBackendDict({
        filename: 'audio-es.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      })
    };
    spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
      .and.returnValue(audioTranslation);
    // Setting selected language to be 'en'.
    spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
      .and.returnValue('en');

    let result = component.isAudioAvailableInCurrentLanguage();
    expect(result).toBe(true);
  });

  it('should return true if the selected audio translation ' +
    'needs to be updated which is not auto generated language code', () => {
    let audioTranslation = {
      en: Voiceover.createFromBackendDict({
        filename: 'audio-en.mp3',
        file_size_bytes: 0.5,
        needs_update: true,
        duration_secs: 0.5
      }),
      es: Voiceover.createFromBackendDict({
        filename: 'audio-es.mp3',
        file_size_bytes: 0.5,
        needs_update: true,
        duration_secs: 0.5
      })
    };
    spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
      .and.returnValue(audioTranslation);
    // Setting selected language to be 'en'.
    spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
      .and.returnValue('en');

    let result = component.doesCurrentAudioTranslationNeedUpdate();

    expect(result).toBe(true);
  });

  it('should not check whether the auto generated audio ' +
    'language code is upto to date', () => {
    spyOn(
      audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
      .and.returnValue(true);

    let result = component.doesCurrentAudioTranslationNeedUpdate();

    expect(result).toBe(false);
  });

  describe('on clicking play pause button ', () => {
    it('should play auto generated audio translation when ' +
      'play button is clicked', () => {
      // Setting auto generated langugae to be true.
      spyOn(
        audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
        .and.returnValue(true);
      // Setting audio is playing to be false.
      spyOn(autogeneratedAudioPlayerService, 'isPlaying')
        .and.returnValue(false);
      spyOn(audioTranslationLanguageService, 'getSpeechSynthesisLanguageCode')
        .and.returnValue('');
      let playSpy = spyOn(autogeneratedAudioPlayerService, 'play')
        .and.callFake((html, language, cb) => {
          cb();
        });

      component.onPlayButtonClicked();
      expect(playSpy).toHaveBeenCalled();
    });

    it('should throw error if speech synthesis language code ' +
      'is null', () => {
      // Setting auto generated langugae to be true.
      spyOn(
        audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
        .and.returnValue(true);
      // Setting audio is playing to be false.
      spyOn(autogeneratedAudioPlayerService, 'isPlaying')
        .and.returnValue(false);
      spyOn(audioTranslationLanguageService, 'getSpeechSynthesisLanguageCode')
        .and.returnValue(null);
      spyOn(autogeneratedAudioPlayerService, 'play')
        .and.callFake((html, language, cb) => {
          cb();
        });

      expect(() => {
        component.onPlayButtonClicked();
      }).toThrowError(
        'speechSynthesisLanguageCode cannot be null at this point.');
    });

    it('should pause auto generated audio translation when ' +
      'pause button is clicked', () => {
      // Setting auto generated langugae to be true.
      spyOn(
        audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
        .and.returnValue(true);
      // Setting audio is playing to be true.
      spyOn(autogeneratedAudioPlayerService, 'isPlaying')
        .and.returnValue(true);
      let pauseSpy = spyOn(autogeneratedAudioPlayerService, 'cancel')
        .and.callThrough();

      component.onPlayButtonClicked();
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should play uploaded audio translation when ' +
      'play button is clicked and when tracks are loaded', () => {
      let audioTranslation = {
        en: Voiceover.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        }),
        es: Voiceover.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        })
      };
      spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
        .and.returnValue(audioTranslation);
      // Setting selected language to be 'en'.
      spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
        .and.returnValue('en');
      // Setting auto generated langugae to be false.
      spyOn(
        audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
        .and.returnValue(false);
      // Setting audio is playing to be true.
      spyOn(audioPlayerService, 'isPlaying')
        .and.returnValue(false);
      // Settings audio tracks loaded to be true.
      spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(true);
      let playSpy = spyOn(audioPlayerService, 'play')
        .and.callThrough();

      component.onPlayButtonClicked();
      expect(playSpy).toHaveBeenCalled();
    });

    it('should load audio track and play audio when ' +
      'play button is clicked', () => {
      let audioTranslation = {
        en: Voiceover.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        }),
        es: Voiceover.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        })
      };
      spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
        .and.returnValue(audioTranslation);
      // Setting selected language to be 'en'.
      spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
        .and.returnValue('en');
      // Setting auto generated langugae to be false.
      spyOn(
        audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
        .and.returnValue(false);
      // Setting audio is playing to be true.
      spyOn(audioPlayerService, 'isPlaying')
        .and.returnValue(false);
      // Settings audio tracks loaded to be false.
      spyOn(audioPlayerService, 'isTrackLoaded').and.returnValue(false);
      let loadAndPlaySpy = spyOn(component, 'loadAndPlayAudioTranslation')
        .and.returnValue();
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('Start');
      spyOn(audioPreloaderService, 'restartAudioPreloader')
        .and.returnValue();

      component.onPlayButtonClicked();
      expect(loadAndPlaySpy).toHaveBeenCalled();
    });

    it('should pause uploaded audio translation when ' +
      'pause button is clicked', () => {
      let audioTranslation = {
        en: Voiceover.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        }),
        es: Voiceover.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        })
      };
      spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
        .and.returnValue(audioTranslation);
      // Setting selected language to be 'en'.
      spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
        .and.returnValue('en');
      // Setting auto generated langugae to be false.
      spyOn(
        audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
        .and.returnValue(false);
      // Setting audio is playing to be true.
      spyOn(audioPlayerService, 'isPlaying')
        .and.returnValue(true);
      let pauseSpy = spyOn(audioPlayerService, 'pause')
        .and.callThrough();

      component.onPlayButtonClicked();
      expect(pauseSpy).toHaveBeenCalled();
    });

    it('should load audio track and play audio ' +
      'which are stored in cache', fakeAsync(() => {
      let audioTranslation = {
        en: Voiceover.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        }),
        es: Voiceover.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        })
      };
      spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
        .and.returnValue(audioTranslation);
      // Setting selected language to be 'en'.
      spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
        .and.returnValue('en');
      spyOn(audioPreloaderService, 'setMostRecentlyRequestedAudioFilename')
        .and.callThrough();
      // Setting cached value to be true.
      spyOn(assetsBackendApiService, 'isCached').and.returnValue(true);
      spyOn(audioPlayerService, 'loadAsync').and.returnValue(Promise.resolve());
      let playCacheAudioSpy = spyOn(component, 'playCachedAudioTranslation')
        .and.callThrough();
      let playSpy = spyOn(audioPlayerService, 'play')
        .and.callThrough();

      component.loadAndPlayAudioTranslation();
      tick();
      discardPeriodicTasks();

      expect(playCacheAudioSpy).toHaveBeenCalled();
      expect(playSpy).toHaveBeenCalled();
    }));

    it('should restart audio track if audio is not' +
      'stored in cache', fakeAsync(() => {
      let audioTranslation = {
        en: Voiceover.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        }),
        es: Voiceover.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        })
      };
      spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
        .and.returnValue(audioTranslation);
      // Setting selected language to be 'en'.
      spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
        .and.returnValue('en');
      spyOn(audioPreloaderService, 'setMostRecentlyRequestedAudioFilename')
        .and.callThrough();
      // Setting cached value to be true.
      spyOn(assetsBackendApiService, 'isCached').and.returnValue(false);
      spyOn(playerPositionService, 'getCurrentStateName').and.returnValue(
        'Start');
      let restartAudioSpy = spyOn(
        audioPreloaderService, 'restartAudioPreloader').and.returnValue();

      component.loadAndPlayAudioTranslation();
      tick();

      expect(restartAudioSpy).toHaveBeenCalled();
    }));
  });

  it('should play audio from cache after finishing loading', () => {
    spyOn(
      audioPreloaderService, 'getMostRecentlyRequestedAudioFilename')
      .and.returnValue('audio-en.mp3');
    component.audioLoadingIndicatorIsShown = true;
    let playCacheAudioSpy = spyOn(component, 'playCachedAudioTranslation');

    component.onFinishedLoadingAudio('audio-en.mp3');
    expect(playCacheAudioSpy).toHaveBeenCalled();
  });

  it('should restart audio bar after selecting a new language', () => {
    component.languagesInExploration = [
      {
        value: 'en',
        displayed: 'english'
      }, {
        value: 'es',
        displayed: 'spanish'
      }
    ];
    component.selectedLanguage.value = 'en';
    let audioTranslation = {
      en: Voiceover.createFromBackendDict({
        filename: 'audio-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      }),
      es: Voiceover.createFromBackendDict({
        filename: 'audio-es.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      })
    };

    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('Start');
    spyOn(
      audioTranslationLanguageService, 'isAutogeneratedLanguageCodeSelected')
      .and.returnValue(false);
    spyOn(audioTranslationLanguageService, 'setCurrentAudioLanguageCode')
      .and.callThrough();
    spyOn(audioTranslationManagerService, 'getCurrentAudioTranslations')
      .and.returnValue(audioTranslation);
    // Setting selected language to be 'en'.
    spyOn(audioTranslationLanguageService, 'getCurrentAudioLanguageCode')
      .and.returnValue('en');
    let languageSetSpy = spyOn(
      audioPreloaderService, 'setMostRecentlyRequestedAudioFilename')
      .and.callThrough();
    let restartAudioBarSpy = spyOn(
      audioPreloaderService, 'restartAudioPreloader')
      .and.returnValue();

    component.onNewLanguageSelected();
    expect(languageSetSpy).toHaveBeenCalledWith('audio-en.mp3');
    expect(restartAudioBarSpy).toHaveBeenCalled();
  });

  it('should throw error if language code is invalid', () => {
    component.selectedLanguage.value = null;

    expect(() => {
      component.onNewLanguageSelected();
    }).toThrowError('Expected a valid language code.');
  });
});
