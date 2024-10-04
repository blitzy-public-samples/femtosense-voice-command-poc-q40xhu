/**
 * This file defines the types and enums related to voice command intents
 * in the Femtosense Voice Command Generation system, ensuring consistent
 * intent representation across all components.
 * 
 * Requirements addressed:
 * 1. Intent Mapping (Technical Specification/1.2.1 Core Functionalities)
 *    - Define standardized intents for voice commands
 * 2. Command Categorization (Technical Specification/2.2 DATABASE DESIGN)
 *    - Enable categorization of voice commands by intent
 */

/**
 * Enum representing the standardized intents for voice commands.
 * This enum is used to categorize and map voice commands to specific actions.
 */
export enum Intent {
  LIGHTS_ON = 'LIGHTS_ON',
  LIGHTS_OFF = 'LIGHTS_OFF',
  WAKE_WORD = 'WAKE_WORD',
  DISTRACTOR = 'DISTRACTOR'
}

/**
 * Type representing the categories of intents.
 * This type is used to group intents into broader categories for easier management and processing.
 */
export type IntentCategory = 'command' | 'wake' | 'distractor';

/**
 * Interface representing the structure of an intent with its associated category.
 * This interface is used to provide additional context and metadata for each intent.
 */
export interface IntentMetadata {
  intent: Intent;
  category: IntentCategory;
}

/**
 * Mapping of Intents to their respective categories.
 * This constant is used to easily determine the category of a given intent.
 */
export const INTENT_CATEGORY_MAP: Record<Intent, IntentCategory> = {
  [Intent.LIGHTS_ON]: 'command',
  [Intent.LIGHTS_OFF]: 'command',
  [Intent.WAKE_WORD]: 'wake',
  [Intent.DISTRACTOR]: 'distractor'
};

/**
 * Type guard to check if a string is a valid Intent.
 * This function is used to validate intent strings at runtime.
 * 
 * @param value - The string to check
 * @returns True if the string is a valid Intent, false otherwise
 */
export function isValidIntent(value: string): value is Intent {
  return Object.values(Intent).includes(value as Intent);
}

/**
 * Function to get the category of a given intent.
 * This function is used to retrieve the category of an intent for processing and organization.
 * 
 * @param intent - The intent to get the category for
 * @returns The category of the given intent
 */
export function getIntentCategory(intent: Intent): IntentCategory {
  return INTENT_CATEGORY_MAP[intent];
}

/**
 * Type representing a function that processes an intent.
 * This type is used for defining handler functions that respond to specific intents.
 */
export type IntentHandler = (intent: Intent) => void;

/**
 * Interface for objects that can handle intents.
 * This interface is used to define classes or objects that can process different intents.
 */
export interface IntentProcessor {
  processIntent(intent: Intent): void;
  getSupportedIntents(): Intent[];
}