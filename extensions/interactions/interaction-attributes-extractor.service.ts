// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for extracting customization argument values from
 * attrs for interactions.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { HtmlEscaperService } from 'services/html-escaper.service';
import { InteractionCustomizationArgs, InteractionCustomizationArgsBackendDict } from
  'extensions/interactions/customization-args-defs';
import { InteractionObjectFactory } from
  'domain/exploration/InteractionObjectFactory';
import { InteractionSpecsConstants, InteractionSpecsKey } from 'pages/interaction-specs.constants';

@Injectable({
  providedIn: 'root'
})
export class InteractionAttributesExtractorService {
  private readonly migratedInteractions: string[] = [
    'Continue',
    'FractionInput',
    'GraphInput',
    'ImageClickInput',
    'CodeRepl',
    'NumericExpressionInput',
    'NumericInput',
    'InteractiveMap',
    'MultipleChoiceInput',
    'SetInput',
    'TextInput',
    'MathEquationInput'
  ];

  constructor(
    private htmlEscaperService: HtmlEscaperService,
    private interactionFactory: InteractionObjectFactory,
  ) {}

  getValuesFromAttributes(
      interactionId: InteractionSpecsKey, attributes: Object
  ): InteractionCustomizationArgs {
    const caBackendDict: InteractionCustomizationArgsBackendDict = {};
    const caSpecs = (
      InteractionSpecsConstants.INTERACTION_SPECS[
        interactionId].customization_arg_specs);
    caSpecs.forEach(caSpec => {
      const caName = caSpec.name;
      const attributesKey = `${caName}WithValue` as keyof typeof attributes;
      Object.defineProperty(caBackendDict, caName, {
        value: {
          value: this.htmlEscaperService.escapedJsonToObj(
            attributes[attributesKey].toString()
          ),
        },
        enumerable: true
      });
    });

    const ca = this.interactionFactory.convertFromCustomizationArgsBackendDict(
      interactionId, caBackendDict);
    if (this.migratedInteractions.indexOf(interactionId) >= 0) {
      return ca;
    }
    const caValues: InteractionCustomizationArgs = {};
    const caKeys = <(keyof InteractionCustomizationArgs)[]> Object.keys(ca);
    caKeys.forEach(caName => {
      const attr = <{ value: Object }> ca[caName];
      Object.defineProperty(caValues, caName, {
        value: attr.value,
        enumerable: true
      });
    });

    return caValues;
  }
}
angular.module('oppia').factory(
  'InteractionAttributesExtractorService',
  downgradeInjectable(InteractionAttributesExtractorService));
